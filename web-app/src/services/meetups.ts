import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Meetup, ParticipantPass } from '../types/models'

const TICKET_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'

export function generateParticipantCode(): string {
  const buf = new Uint8Array(8)
  crypto.getRandomValues(buf)
  const chars = Array.from(buf, (b) => TICKET_ALPHABET[b % TICKET_ALPHABET.length])
  return `MTT-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

function snapToPass(userId: string, data: Record<string, unknown>): ParticipantPass {
  return {
    userId,
    code: String(data.code ?? ''),
    joinedAt:
      (data.joinedAt as Timestamp | undefined)?.toDate() ?? new Date(),
    checkedIn: Boolean(data.checkedIn),
    checkedInAt:
      (data.checkedInAt as Timestamp | undefined)?.toDate() ?? null,
    checkedInBy: data.checkedInBy ? String(data.checkedInBy) : null,
  }
}

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }
  return db
}

function snapToMeetup(id: string, data: Record<string, unknown>): Meetup {
  const time = data.time as { start: Timestamp; end: Timestamp }
  const place = data.place as Meetup['place']
  const participants = Array.isArray(data.participants)
    ? (data.participants as string[])
    : []
  const storedCount = Number(data.participantCount ?? 0)
  const participantCount = Math.max(participants.length, storedCount)
  return {
    id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    creatorId: String(data.creatorId ?? ''),
    place,
    time: { start: time.start.toDate(), end: time.end.toDate() },
    maxParticipants: Number(data.maxParticipants ?? 10),
    participants,
    participantCount,
    locationSharingEnabled: Boolean(data.locationSharingEnabled),
    ticketingEnabled:
      data.ticketingEnabled === undefined
        ? true
        : Boolean(data.ticketingEnabled),
    status: (data.status as Meetup['status']) ?? 'active',
    createdAt: (data.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
  }
}

export async function createMeetup(
  input: Omit<
    Meetup,
    'id' | 'createdAt' | 'participants' | 'participantCount' | 'status'
  > & { creatorId: string },
): Promise<string> {
  const d = requireDb()
  const ref = await addDoc(collection(d, 'meetups'), {
    title: input.title,
    description: input.description,
    tags: input.tags,
    creatorId: input.creatorId,
    place: input.place,
    time: {
      start: Timestamp.fromDate(input.time.start),
      end: Timestamp.fromDate(input.time.end),
    },
    maxParticipants: input.maxParticipants,
    participants: [input.creatorId],
    participantCount: 1,
    locationSharingEnabled: input.locationSharingEnabled,
    ticketingEnabled: input.ticketingEnabled,
    status: 'active',
    createdAt: serverTimestamp(),
    imageUrl: input.imageUrl ?? null,
  })
  await updateDoc(doc(d, 'users', input.creatorId), {
    createdMeetups: increment(1),
  })
  return ref.id
}

export function subscribeActiveMeetups(
  onData: (items: Meetup[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const d = requireDb()
  // Single-field orderBy uses the default index — no composite index required.
  // We over-fetch then keep `active` only (avoids where + orderBy composite).
  const qy = query(
    collection(d, 'meetups'),
    orderBy('createdAt', 'desc'),
    limit(96),
  )
  return onSnapshot(
    qy,
    (snap) => {
      const list: Meetup[] = []
      snap.forEach((s) => {
        const m = snapToMeetup(s.id, s.data() as Record<string, unknown>)
        if (m.status === 'active') {
          list.push(m)
        }
      })
      onData(list.slice(0, 48))
    },
    (err) => onError?.(err as Error),
  )
}

export async function getMeetup(id: string): Promise<Meetup | null> {
  const d = requireDb()
  const ref = doc(d, 'meetups', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    return null
  }
  return snapToMeetup(snap.id, snap.data() as Record<string, unknown>)
}

export function subscribeMeetup(
  id: string,
  onData: (m: Meetup | null) => void,
  onError?: (e: Error) => void,
): () => void {
  const d = requireDb()
  const ref = doc(d, 'meetups', id)
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      onData(snapToMeetup(snap.id, snap.data() as Record<string, unknown>))
    },
    (err) => onError?.(err as Error),
  )
}

export async function joinMeetup(meetupId: string, userId: string): Promise<void> {
  const d = requireDb()
  const ref = doc(d, 'meetups', meetupId)
  const passRef = doc(d, 'meetups', meetupId, 'participants', userId)
  let didJoin = false
  await runTransaction(d, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) {
      throw new Error('Meetup not found.')
    }
    const data = snap.data() as Record<string, unknown>
    const participants = (data.participants as string[]) ?? []
    const alreadyJoined = participants.includes(userId)
    const ticketingEnabled =
      data.ticketingEnabled === undefined
        ? true
        : Boolean(data.ticketingEnabled)
    const passSnap = ticketingEnabled ? await tx.get(passRef) : null
    if (alreadyJoined && (!ticketingEnabled || passSnap?.exists())) {
      return
    }
    if (!alreadyJoined) {
      const max = Number(data.maxParticipants ?? 0)
      if (participants.length >= max) {
        throw new Error('This meetup is full.')
      }
      didJoin = true
      tx.update(ref, {
        participants: arrayUnion(userId),
        participantCount: increment(1),
      })
    }
    if (ticketingEnabled && passSnap && !passSnap.exists()) {
      tx.set(passRef, {
        code: generateParticipantCode(),
        joinedAt: serverTimestamp(),
        checkedIn: false,
        checkedInAt: null,
        checkedInBy: null,
      })
    }
  })
  if (didJoin) {
    await updateDoc(doc(d, 'users', userId), {
      joinedMeetups: increment(1),
    })
  }
}

export async function leaveMeetup(
  meetupId: string,
  userId: string,
): Promise<void> {
  const d = requireDb()
  const ref = doc(d, 'meetups', meetupId)
  const passRef = doc(d, 'meetups', meetupId, 'participants', userId)
  let didLeave = false
  await runTransaction(d, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) {
      throw new Error('Meetup not found.')
    }
    const data = snap.data() as Record<string, unknown>
    const participants = (data.participants as string[]) ?? []
    if (!participants.includes(userId)) {
      return
    }
    if (data.creatorId === userId) {
      throw new Error(
        'Organizers can’t leave their own meetup. Cancel the event instead.',
      )
    }
    didLeave = true
    tx.update(ref, {
      participants: arrayRemove(userId),
      participantCount: increment(-1),
    })
    const passSnap = await tx.get(passRef)
    if (passSnap.exists()) {
      tx.delete(passRef)
    }
  })
  if (didLeave) {
    await updateDoc(doc(d, 'users', userId), {
      joinedMeetups: increment(-1),
    })
  }
}

export function subscribeMyPass(
  meetupId: string,
  userId: string,
  onData: (pass: ParticipantPass | null) => void,
  onError?: (e: Error) => void,
): () => void {
  const d = requireDb()
  const ref = doc(d, 'meetups', meetupId, 'participants', userId)
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      onData(snapToPass(snap.id, snap.data() as Record<string, unknown>))
    },
    (err) => onError?.(err as Error),
  )
}

export function subscribeAllPasses(
  meetupId: string,
  onData: (passes: ParticipantPass[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const d = requireDb()
  const col = collection(d, 'meetups', meetupId, 'participants')
  return onSnapshot(
    col,
    (snap) => {
      const list: ParticipantPass[] = []
      snap.forEach((s) => {
        list.push(snapToPass(s.id, s.data() as Record<string, unknown>))
      })
      list.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      onData(list)
    },
    (err) => onError?.(err as Error),
  )
}

function normalizeCode(input: string): string {
  return input.trim().toUpperCase()
}

export async function checkInParticipant(
  meetupId: string,
  participantUserId: string,
  organizerUid: string,
): Promise<void> {
  const d = requireDb()
  const ref = doc(d, 'meetups', meetupId, 'participants', participantUserId)
  await updateDoc(ref, {
    checkedIn: true,
    checkedInAt: serverTimestamp(),
    checkedInBy: organizerUid,
  })
}

export async function checkInByCode(
  meetupId: string,
  rawCode: string,
  organizerUid: string,
): Promise<ParticipantPass> {
  const d = requireDb()
  const code = normalizeCode(rawCode)
  if (!code) {
    throw new Error('Enter a participant code.')
  }
  const col = collection(d, 'meetups', meetupId, 'participants')
  const qy = query(col, where('code', '==', code), limit(1))
  const found = await getDocs(qy)
  if (found.empty) {
    throw new Error('No participant matches that code for this meetup.')
  }
  const doc0 = found.docs[0]
  const pass = snapToPass(doc0.id, doc0.data() as Record<string, unknown>)
  if (pass.checkedIn) {
    return pass
  }
  await checkInParticipant(meetupId, pass.userId, organizerUid)
  return {
    ...pass,
    checkedIn: true,
    checkedInAt: new Date(),
    checkedInBy: organizerUid,
  }
}

export async function setLiveLocation(
  meetupId: string,
  userId: string,
  lat: number,
  lng: number,
): Promise<void> {
  const d = requireDb()
  const ref = doc(d, 'meetups', meetupId, 'liveLocations', userId)
  await setDoc(
    ref,
    {
      lat,
      lng,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function clearLiveLocation(
  meetupId: string,
  userId: string,
): Promise<void> {
  const d = requireDb()
  await deleteDoc(doc(d, 'meetups', meetupId, 'liveLocations', userId))
}

export function subscribeLiveLocations(
  meetupId: string,
  onData: (rows: { userId: string; lat: number; lng: number; updatedAt: Date }[]) => void,
): () => void {
  const d = requireDb()
  const col = collection(d, 'meetups', meetupId, 'liveLocations')
  return onSnapshot(col, (snap) => {
    const rows: { userId: string; lat: number; lng: number; updatedAt: Date }[] =
      []
    snap.forEach((s) => {
      const data = s.data() as Record<string, unknown>
      rows.push({
        userId: s.id,
        lat: Number(data.lat),
        lng: Number(data.lng),
        updatedAt:
          (data.updatedAt as Timestamp | undefined)?.toDate() ?? new Date(),
      })
    })
    onData(rows)
  })
}

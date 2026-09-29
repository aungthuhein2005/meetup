import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckTicketModal } from '../components/CheckTicketModal'
import { MeetupPlaceMap } from '../components/MeetupPlaceMap'
import { MeetupShareCard } from '../components/MeetupShareCard'
import { MyTicketCard } from '../components/MyTicketCard'
import { useAuth } from '../context/AuthContext'
import {
  clearLiveLocation,
  joinMeetup,
  leaveMeetup,
  setLiveLocation,
  subscribeLiveLocations,
  subscribeMeetup,
  subscribeMyPass,
} from '../services/meetups'
import type { Meetup, ParticipantPass } from '../types/models'
import { getMeetupStatus } from '../utils/meetupStatus'

export function MeetupDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [meetup, setMeetup] = useState<Meetup | null | undefined>(undefined)
  const [live, setLive] = useState<
    { userId: string; lat: number; lng: number }[]
  >([])
  const [error, setError] = useState<string | null>(null)
  const [joinBusy, setJoinBusy] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [pass, setPass] = useState<ParticipantPass | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [checkTicketOpen, setCheckTicketOpen] = useState(false)
  const [leaveBusy, setLeaveBusy] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }
    const unsub = subscribeMeetup(id, setMeetup, (e) => setError(e.message))
    return () => unsub()
  }, [id])

  useEffect(() => {
    if (!id || !meetup?.locationSharingEnabled) {
      return
    }
    const unsub = subscribeLiveLocations(id, (rows) =>
      setLive(rows.map((r) => ({ userId: r.userId, lat: r.lat, lng: r.lng }))),
    )
    return () => unsub()
  }, [id, meetup?.locationSharingEnabled])

  const isParticipant = Boolean(
    user && meetup && meetup.participants.includes(user.uid),
  )
  const isOrganizer = Boolean(user && meetup && meetup.creatorId === user.uid)

  const ticketingEnabled = meetup?.ticketingEnabled ?? true

  useEffect(() => {
    if (!id || !user || !isParticipant || !ticketingEnabled) {
      setPass(null)
      return
    }
    const unsub = subscribeMyPass(id, user.uid, setPass)
    return () => unsub()
  }, [id, user, isParticipant, ticketingEnabled])

  const eventWindowActive =
    meetup &&
    Date.now() >= meetup.time.start.getTime() &&
    Date.now() <= meetup.time.end.getTime()

  useEffect(() => {
    if (
      !sharing ||
      !id ||
      !user ||
      !meetup?.locationSharingEnabled ||
      !isParticipant ||
      !eventWindowActive
    ) {
      return
    }
    let watchId: number | null = null
    let last = 0
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        if (now - last < 8000) {
          return
        }
        last = now
        void setLiveLocation(
          id,
          user.uid,
          pos.coords.latitude,
          pos.coords.longitude,
        )
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
    return () => {
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [
    sharing,
    id,
    user,
    meetup?.locationSharingEnabled,
    isParticipant,
    eventWindowActive,
    meetup,
  ])

  useEffect(() => {
    return () => {
      if (sharing && id && user) {
        void clearLiveLocation(id, user.uid)
      }
    }
  }, [sharing, id, user])

  useEffect(() => {
    if (!meetup || !eventWindowActive) {
      setSharing(false)
    }
  }, [meetup, eventWindowActive])

  async function onJoin() {
    if (!id || !user) {
      return
    }
    setJoinBusy(true)
    setError(null)
    try {
      await joinMeetup(id, user.uid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join.')
    } finally {
      setJoinBusy(false)
    }
  }

  async function onLeave() {
    if (!id || !user) {
      return
    }
    const ok = window.confirm('Leave this meetup? You can re-join anytime.')
    if (!ok) {
      return
    }
    setLeaveBusy(true)
    setError(null)
    try {
      if (sharing) {
        await clearLiveLocation(id, user.uid)
        setSharing(false)
      }
      await leaveMeetup(id, user.uid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not leave.')
    } finally {
      setLeaveBusy(false)
    }
  }

  async function onToggleShare(next: boolean) {
    if (!id || !user) {
      return
    }
    if (!next) {
      setSharing(false)
      await clearLiveLocation(id, user.uid)
      return
    }
    setSharing(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void setLiveLocation(
          id,
          user.uid,
          pos.coords.latitude,
          pos.coords.longitude,
        )
      },
      () => {
        setError('Location permission is required to share live position.')
        setSharing(false)
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }

  if (!id) {
    return <p className="text-muted">Missing meetup id.</p>
  }

  if (meetup === undefined) {
    return <p className="text-muted">Loading…</p>
  }

  if (meetup === null) {
    return <p className="text-muted">This meetup could not be found.</p>
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${meetup.place.lat},${meetup.place.lng}`,
  )}`
  const capacityPct = Math.min(
    100,
    Math.round((meetup.participantCount / Math.max(1, meetup.maxParticipants)) * 100),
  )
  const fullness =
    capacityPct >= 100
      ? 'Full'
      : capacityPct >= 80
        ? 'Almost full'
        : capacityPct >= 50
          ? 'Filling up'
          : 'Open spots'
  const scheduleStatus = getMeetupStatus(meetup)
  const statusLabel =
    meetup.status === 'active'
      ? scheduleStatus === 'live'
        ? 'Live now'
        : scheduleStatus === 'upcoming'
          ? 'Upcoming'
          : 'Ended'
      : meetup.status

  return (
    <div className="space-y-5 pb-24">
      {/* Hero */}
      <header className="rounded-3xl border border-surface-700 bg-linear-to-br from-surface-900/80 to-surface-800/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            {statusLabel}
          </span>
          <span className="text-xs text-muted">{fullness}</span>
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-slate-100">
          {meetup.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden>🗓️</span>
            {format(meetup.time.start, 'EEE d MMM · HH:mm')}
            <span className="text-slate-500"> – {format(meetup.time.end, 'HH:mm')}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden>📍</span>
            {meetup.place.name}
          </span>
        </div>
        {meetup.description ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {meetup.description}
          </p>
        ) : null}

        {/* Action row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950"
          >
            Open Maps
          </a>
          <button
            type="button"
            onClick={() => setShowShare((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl bg-surface-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-surface-700"
          >
            {showShare ? 'Hide share' : 'Share'}
          </button>
          {isOrganizer && ticketingEnabled ? (
            <button
              type="button"
              onClick={() => setCheckTicketOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/15"
            >
              🎟 Check ticket
            </button>
          ) : null}
        </div>
      </header>

      {showShare ? (
        <MeetupShareCard meetupId={meetup.id} title={meetup.title} />
      ) : null}

      <MeetupPlaceMap
        lat={meetup.place.lat}
        lng={meetup.place.lng}
        label={meetup.place.name}
      />

      {error ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {isParticipant && ticketingEnabled && pass ? (
        <MyTicketCard pass={pass} />
      ) : null}
      {isParticipant && !ticketingEnabled ? (
        <p className="rounded-2xl border border-surface-700 bg-surface-800/40 p-3 text-sm text-muted">
          No ticket needed — just show up at the venue.
        </p>
      ) : null}

      {/* Participants */}
      <section className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Participants
            </p>
            <p className="mt-0.5 text-lg font-semibold text-slate-100">
              {meetup.participantCount}
              <span className="text-sm font-normal text-muted">
                {' '}/ {meetup.maxParticipants}
              </span>
            </p>
          </div>
          {user && !meetup.participants.includes(user.uid) ? (
            <button
              type="button"
              disabled={joinBusy || capacityPct >= 100}
              onClick={() => void onJoin()}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950 disabled:opacity-50"
            >
              {capacityPct >= 100
                ? 'Full'
                : joinBusy
                  ? 'Joining…'
                  : 'Join meetup'}
            </button>
          ) : isParticipant ? (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
              You’re in
            </span>
          ) : null}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-700/60">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${capacityPct}%` }}
          />
        </div>
        {isParticipant && !isOrganizer ? (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={leaveBusy}
              onClick={() => void onLeave()}
              className="text-xs text-muted underline-offset-2 hover:text-red-300 hover:underline disabled:opacity-50"
            >
              {leaveBusy ? 'Leaving…' : 'Leave meetup'}
            </button>
          </div>
        ) : null}
      </section>

      {isOrganizer && user && ticketingEnabled ? (
        <CheckTicketModal
          open={checkTicketOpen}
          meetupId={meetup.id}
          organizerUid={user.uid}
          onClose={() => setCheckTicketOpen(false)}
        />
      ) : null}

      {meetup.locationSharingEnabled && isParticipant ? (
        <section className="rounded-2xl border border-surface-700 bg-surface-900/60 p-4">
          <h2 className="font-display text-base font-semibold text-slate-100">
            Live location
          </h2>
          <p className="mt-1 text-xs text-muted">
            Optional. Updates every ~8s. Stops when the event ends or you turn
            it off.
          </p>
          {!eventWindowActive ? (
            <p className="mt-3 text-sm text-muted">
              Available only during the scheduled event window.
            </p>
          ) : (
            <label className="mt-4 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={sharing}
                onChange={(e) => void onToggleShare(e.target.checked)}
                className="size-4 accent-brand"
              />
              <span className="text-sm text-slate-200">
                Share my live position
              </span>
            </label>
          )}
          {live.length > 0 ? (
            <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
              {live.map((row) => (
                <li key={row.userId}>
                  Participant{' '}
                  {row.userId === user?.uid
                    ? '(you)'
                    : `${row.userId.slice(0, 6)}…`}{' '}
                  · {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                </li>
              ))}
            </ul>
          ) : eventWindowActive ? (
            <p className="mt-3 text-xs text-muted">No active live pins yet.</p>
          ) : null}
        </section>
      ) : null}

      {meetup.tags.length > 0 ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Tags</p>
          <ul className="flex flex-wrap gap-2">
            {meetup.tags.map((t) => (
              <li
                key={t}
                className="rounded-lg bg-surface-800 px-2 py-1 text-xs text-slate-300"
              >
                #{t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

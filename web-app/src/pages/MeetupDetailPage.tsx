import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  clearLiveLocation,
  joinMeetup,
  setLiveLocation,
  subscribeLiveLocations,
  subscribeMeetup,
} from '../services/meetups'
import type { Meetup } from '../types/models'

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
        void setLiveLocation(id, user.uid, pos.coords.latitude, pos.coords.longitude)
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
        void setLiveLocation(id, user.uid, pos.coords.latitude, pos.coords.longitude)
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
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const staticMap =
    mapsKey &&
    `https://maps.googleapis.com/maps/api/staticmap?center=${meetup.place.lat},${meetup.place.lng}&zoom=15&size=640x280&scale=2&key=${mapsKey}`

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-100">
          {meetup.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{meetup.description}</p>
        <p className="mt-3 text-sm text-slate-300">
          {format(meetup.time.start, 'EEE d MMM yyyy · HH:mm')} –{' '}
          {format(meetup.time.end, 'HH:mm')}
        </p>
        <p className="text-sm text-slate-400">{meetup.place.name}</p>
        <p className="text-sm text-slate-500">{meetup.place.address}</p>
      </div>

      {staticMap ? (
        <img
          src={staticMap}
          alt="Map preview"
          className="w-full rounded-2xl border border-surface-700"
        />
      ) : null}

      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-xl bg-surface-800 px-4 py-2 text-sm font-medium text-brand hover:bg-surface-700"
      >
        Open in Google Maps
      </a>

      {error ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4">
        <p className="text-sm text-slate-300">
          <span className="font-medium text-slate-100">
            {meetup.participantCount}
          </span>{' '}
          participants · cap {meetup.maxParticipants}
        </p>
        {user && !meetup.participants.includes(user.uid) ? (
          <button
            type="button"
            disabled={joinBusy}
            onClick={() => void onJoin()}
            className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-surface-950 disabled:opacity-50"
          >
            {joinBusy ? 'Joining…' : 'Join meetup'}
          </button>
        ) : null}
      </div>

      {meetup.locationSharingEnabled && isParticipant ? (
        <section className="rounded-2xl border border-surface-700 bg-surface-900/60 p-4">
          <h2 className="font-display text-lg text-slate-100">Live location</h2>
          <p className="mt-1 text-xs text-muted">
            Optional. Updates throttle to ~8s. Stops when the event window ends or you turn it off.
            Data is removed from the client when sharing stops.
          </p>
          {!eventWindowActive ? (
            <p className="mt-3 text-sm text-muted">
              Live sharing is only available during the scheduled event window.
            </p>
          ) : (
            <label className="mt-4 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={sharing}
                onChange={(e) => void onToggleShare(e.target.checked)}
                className="size-4 accent-brand"
              />
              <span className="text-sm text-slate-200">Share my live position</span>
            </label>
          )}
          {live.length > 0 ? (
            <ul className="mt-4 space-y-2 text-xs text-slate-400">
              {live.map((row) => (
                <li key={row.userId}>
                  Participant {row.userId === user?.uid ? '(you)' : row.userId.slice(0, 6)}… ·{' '}
                  {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted">No active live pins right now.</p>
          )}
        </section>
      ) : null}

      {meetup.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {meetup.tags.map((t) => (
            <li
              key={t}
              className="rounded-lg bg-surface-800 px-2 py-1 text-xs text-slate-300"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

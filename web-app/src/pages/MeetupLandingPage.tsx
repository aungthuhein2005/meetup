import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { MeetupPlaceMap } from '../components/MeetupPlaceMap'
import { useAuth } from '../context/AuthContext'
import { getMeetup, joinMeetup, subscribeMeetup } from '../services/meetups'
import type { Meetup } from '../types/models'

export function MeetupLandingPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const previewMode = searchParams.get('preview') === '1'
  const { user, profile } = useAuth()
  const [meetup, setMeetup] = useState<Meetup | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [slowLoad, setSlowLoad] = useState(false)

  useEffect(() => {
    if (previewMode) {
      return
    }
    if (!id || !user || !profile?.onboardingComplete) {
      return
    }
    if (!meetup) {
      return
    }
    navigate(`/meetups/${id}`, { replace: true })
  }, [id, user, profile?.onboardingComplete, meetup, navigate, previewMode])

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    setSlowLoad(false)
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) {
        setSlowLoad(true)
      }
    }, 5000)

    void getMeetup(id)
      .then((m) => {
        if (!cancelled) {
          setMeetup(m)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load meetup.')
          setMeetup(null)
        }
      })

    try {
      const unsub = subscribeMeetup(
        id,
        (m) => {
          if (!cancelled) {
            setMeetup(m)
          }
        },
        (e) => {
          if (!cancelled) {
            setError(e.message)
          }
        },
      )
      return () => {
        cancelled = true
        window.clearTimeout(slowTimer)
        unsub()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meetup.')
      setMeetup(null)
      return () => {
        cancelled = true
        window.clearTimeout(slowTimer)
      }
    }
  }, [id])

  const isParticipant = useMemo(
    () => Boolean(user && meetup && meetup.participants.includes(user.uid)),
    [meetup, user],
  )

  async function onJoin() {
    if (!id) {
      return
    }
    if (!user) {
      navigate('/login', { state: { from: location }, replace: false })
      return
    }
    if (profile && !profile.onboardingComplete) {
      navigate('/onboarding', { replace: false })
      return
    }
    setBusy(true)
    setError(null)
    try {
      await joinMeetup(id, user.uid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join.')
    } finally {
      setBusy(false)
    }
  }

  if (!id) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-muted">Missing meetup id.</p>
      </div>
    )
  }

  if (meetup === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-10">
        <p className="text-muted">Loading meetup…</p>
        {slowLoad ? (
          <p className="text-xs text-amber-300/90">
            Still loading. On a phone, make sure you’re on the same Wi-Fi and
            your{' '}
            <code className="text-brand">VITE_APP_URL</code> uses your laptop’s
            LAN IP (not localhost).
          </p>
        ) : null}
      </div>
    )
  }

  if (error && meetup === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate('/login', { state: { from: location } })}
          className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950"
        >
          Sign in
        </button>
      </div>
    )
  }

  if (meetup === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-muted">This meetup could not be found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-24 pt-6">
      {previewMode && user ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <span>
            Public preview mode — this is what guests see when they scan your QR.
          </span>
          <button
            type="button"
            onClick={() => navigate(`/meetups/${id}`, { replace: true })}
            className="rounded-md border border-amber-500/40 px-2 py-1 text-[11px] font-medium text-amber-100 hover:bg-amber-500/10"
          >
            Exit preview
          </button>
        </div>
      ) : null}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand">
          Public meetup link
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-slate-100">
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

      <div className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-300">
            <span className="font-medium text-slate-100">
              {meetup.participantCount}
            </span>{' '}
            participants · cap {meetup.maxParticipants}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              meetup.ticketingEnabled
                ? 'bg-brand/15 text-brand'
                : 'bg-surface-700 text-slate-300'
            }`}
          >
            {meetup.ticketingEnabled ? 'Ticketed' : 'No ticket needed'}
          </span>
        </div>
        {isParticipant ? (
          <p className="mt-3 text-sm text-slate-400">You already joined.</p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onJoin()}
            className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-surface-950 disabled:opacity-50"
          >
            {busy ? 'Joining…' : user ? 'Join meetup' : 'Sign in to join'}
          </button>
        )}
        {!user ? (
          <p className="mt-3 text-xs text-muted">
            You can browse this meetup without an account. Joining requires a
            quick sign in.
          </p>
        ) : null}
      </div>

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

      <footer className="pt-2 text-center text-xs text-muted">
        Shared via{' '}
        <span className="font-display text-brand">MeetToTalk</span>
      </footer>
    </div>
  )
}

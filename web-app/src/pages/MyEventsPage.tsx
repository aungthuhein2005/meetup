import { formatDistanceToNowStrict } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MeetupCard } from '../components/MeetupCard'
import { useAuth } from '../context/AuthContext'
import { subscribeActiveMeetups } from '../services/meetups'
import type { Meetup } from '../types/models'
import { compareByStatusThen } from '../utils/meetupStatus'

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}

export function MyEventsPage() {
  const { user, profile } = useAuth()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const now = useNow()

  useEffect(() => {
    try {
      const unsub = subscribeActiveMeetups(setMeetups, (e) =>
        setLoadError(e.message),
      )
      return () => unsub()
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load meetups.')
      return () => {}
    }
  }, [])

  const { hosting, joinedUpcoming, joinedPast, nextUp } = useMemo(() => {
    if (!user) {
      return {
        hosting: [] as Meetup[],
        joinedUpcoming: [] as Meetup[],
        joinedPast: [] as Meetup[],
        nextUp: null as Meetup | null,
      }
    }
    const ts = now.getTime()
    const byStatus = compareByStatusThen<Meetup>(
      (m) => m,
      (a, b) => a.time.start.getTime() - b.time.start.getTime(),
      now,
    )
    const hosting = meetups
      .filter((m) => m.creatorId === user.uid)
      .sort(byStatus)
    const joined = meetups
      .filter((m) => m.creatorId !== user.uid && m.participants.includes(user.uid))
      .sort((a, b) => a.time.start.getTime() - b.time.start.getTime())
    const joinedUpcoming = joined.filter((m) => m.time.end.getTime() >= ts)
    const joinedPast = joined.filter((m) => m.time.end.getTime() < ts).reverse()

    const upcoming = [...hosting, ...joinedUpcoming]
      .filter((m) => m.time.end.getTime() >= ts)
      .sort((a, b) => a.time.start.getTime() - b.time.start.getTime())
    const nextUp = upcoming[0] ?? null

    return { hosting, joinedUpcoming, joinedPast, nextUp }
  }, [meetups, user, now])

  const nextStatus = useMemo(() => {
    if (!nextUp) {
      return null
    }
    const start = nextUp.time.start.getTime()
    const end = nextUp.time.end.getTime()
    const ts = now.getTime()
    if (ts >= start && ts <= end) {
      return {
        kind: 'live' as const,
        label: 'Happening now',
        suffix: `ends ${formatDistanceToNowStrict(nextUp.time.end, {
          addSuffix: true,
        })}`,
      }
    }
    if (ts < start) {
      return {
        kind: 'soon' as const,
        label: 'Starts',
        suffix: formatDistanceToNowStrict(nextUp.time.start, {
          addSuffix: true,
        }),
      }
    }
    return null
  }, [nextUp, now])

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="font-display text-2xl font-semibold text-slate-100">
          My events
        </h1>
        <p className="mt-1 text-sm text-muted">
          {profile?.name ? `Hi ${profile.name.split(' ')[0]} — ` : ''}your
          upcoming and past meetups.
        </p>
      </header>

      {loadError ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {loadError}
        </p>
      ) : null}

      {nextUp && nextStatus ? (
        <Link
          to={`/meetups/${nextUp.id}`}
          className="block rounded-3xl border border-brand/40 bg-linear-to-br from-brand/15 to-surface-900/40 p-5 transition hover:border-brand/60"
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                nextStatus.kind === 'live'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-brand/20 text-brand'
              }`}
            >
              {nextStatus.label}
            </span>
            <span className="text-xs text-muted">Next up</span>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold leading-tight text-slate-100">
            {nextUp.title}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {nextStatus.suffix} · 📍 {nextUp.place.name}
          </p>
        </Link>
      ) : null}

      <Section
        title="Hosting"
        emptyText="You haven’t created any meetups yet."
        ctaTo="/meetups/new"
        ctaLabel="Create a meetup"
        meetups={hosting}
      />

      <Section
        title="Joined"
        emptyText="No upcoming events you’ve joined."
        ctaTo="/"
        ctaLabel="Discover meetups"
        meetups={joinedUpcoming}
      />

      {joinedPast.length > 0 ? (
        <Section title="Past" emptyText="" meetups={joinedPast} muted />
      ) : null}
    </div>
  )
}

type SectionProps = {
  title: string
  meetups: Meetup[]
  emptyText: string
  ctaTo?: string
  ctaLabel?: string
  muted?: boolean
}

function Section({
  title,
  meetups,
  emptyText,
  ctaTo,
  ctaLabel,
  muted,
}: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg text-slate-100">{title}</h2>
        <span className="text-xs text-muted">{meetups.length}</span>
      </div>
      {meetups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-600 p-6 text-center">
          <p className="text-sm text-muted">{emptyText}</p>
          {ctaTo && ctaLabel ? (
            <Link
              to={ctaTo}
              className="mt-3 inline-block rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-surface-950"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className={`space-y-3 ${muted ? 'opacity-80' : ''}`}>
          {meetups.map((m) => (
            <li key={m.id}>
              <MeetupCard meetup={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

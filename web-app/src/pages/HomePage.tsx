import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MeetupCard } from '../components/MeetupCard'
import { useAuth } from '../context/AuthContext'
import { isGeminiConfigured, rankMeetupsWithGemini } from '../services/gemini'
import { subscribeActiveMeetups } from '../services/meetups'
import type { Meetup } from '../types/models'
import { haversineKm } from '../utils/geo'
import { compareByStatusThen, getMeetupStatus } from '../utils/meetupStatus'

function matchesQuery(m: Meetup, q: string): boolean {
  if (!q) {
    return true
  }
  const needle = q.toLowerCase()
  return (
    m.title.toLowerCase().includes(needle) ||
    m.description.toLowerCase().includes(needle) ||
    m.place.name.toLowerCase().includes(needle) ||
    m.tags.some((t) => t.toLowerCase().includes(needle))
  )
}

export function HomePage() {
  const { profile } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = (params.get('q') ?? '').trim()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [aiIds, setAiIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const unsub = subscribeActiveMeetups(
        setMeetups,
        (e) => setLoadError(e.message),
      )
      return () => unsub()
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load meetups.')
      return () => {}
    }
  }, [])

  const center = profile?.location ?? null
  const radiusKm = profile?.radiusKm ?? 5

  const nearby = useMemo(() => {
    const activeOnly = meetups.filter((m) => getMeetupStatus(m) !== 'ended')
    const base = center
      ? activeOnly
          .map((m) => ({
            m,
            d: haversineKm(center, { lat: m.place.lat, lng: m.place.lng }),
          }))
          .filter((x) => x.d <= radiusKm)
          .sort(compareByStatusThen((x) => x.m, (a, b) => a.d - b.d))
          .map((x) => x.m)
      : [...activeOnly].sort(
          compareByStatusThen(
            (m) => m,
            (a, b) => a.time.start.getTime() - b.time.start.getTime(),
          ),
        )
    return query ? base.filter((m) => matchesQuery(m, query)) : base
  }, [meetups, center, radiusKm, query])

  const aiSet = useMemo(() => new Set(aiIds), [aiIds])

  const allMeetups = useMemo(() => {
    const aiRank = new Map(aiIds.map((id, i) => [id, i]))
    const STATUS_ORDER: Record<'live' | 'upcoming' | 'ended', number> = {
      live: 0,
      upcoming: 1,
      ended: 2,
    }
    const now = Date.now()
    const statusFor = (m: Meetup): 'live' | 'upcoming' | 'ended' => {
      if (now > m.time.end.getTime()) return 'ended'
      if (now >= m.time.start.getTime()) return 'live'
      return 'upcoming'
    }
    return [...meetups].sort((a, b) => {
      const ra = aiRank.has(a.id) ? aiRank.get(a.id)! : Number.MAX_SAFE_INTEGER
      const rb = aiRank.has(b.id) ? aiRank.get(b.id)! : Number.MAX_SAFE_INTEGER
      if (ra !== rb) return ra - rb
      const sa = STATUS_ORDER[statusFor(a)]
      const sb = STATUS_ORDER[statusFor(b)]
      if (sa !== sb) return sa - sb
      if (center) {
        const da = haversineKm(center, { lat: a.place.lat, lng: a.place.lng })
        const db = haversineKm(center, { lat: b.place.lat, lng: b.place.lng })
        if (da !== db) return da - db
      }
      return a.time.start.getTime() - b.time.start.getTime()
    })
  }, [meetups, aiIds, center])

  useEffect(() => {
    if (!isGeminiConfigured() || !nearby.length) {
      setAiIds([])
      return
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      void rankMeetupsWithGemini({
        userInterests: profile?.interests ?? [],
        userLocationLabel: center
          ? `Within ~${radiusKm} km of user's saved coordinates`
          : 'Location not set; rank by interests only.',
        meetups: nearby.map((m) => ({
          id: m.id,
          title: m.title,
          tags: m.tags,
          description: m.description,
        })),
      })
        .then((ids) => {
          if (!cancelled) {
            setAiIds(ids)
          }
        })
        .catch(() => {
          // AI ranking is best-effort; ignore failure for the For-you pill.
        })
    }, 500)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [nearby, profile?.interests, center, radiusKm])

  const liveCount = meetups.filter((meetup) => getMeetupStatus(meetup) === 'live').length
  const upcomingCount = meetups.filter((meetup) => getMeetupStatus(meetup) === 'upcoming').length
  const firstName = profile?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-9 pb-24 lg:pb-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand/70">Event workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {query ? `Results for “${query}”` : `Good to see you, ${firstName}.`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {query ? `Searching titles, tags, venues, and descriptions${center ? ` within ${radiusKm} km` : ''}.` : center ? `Discover conversations and communities within ${radiusKm} km of your saved area.` : 'Discover what your community is hosting, or start something of your own.'}
          </p>
        </div>
        <Link to="/meetups/new" className="hidden shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-surface-950 shadow-[0_10px_30px_rgba(45,212,191,0.14)] transition hover:bg-teal-300 lg:flex"><span className="text-lg leading-none">+</span>Create event</Link>
      </header>

      {!query ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Live now', value: liveCount, note: 'Happening nearby', color: 'text-emerald-300' },
            { label: 'Upcoming', value: upcomingCount, note: 'Open events', color: 'text-brand' },
            { label: 'Your radius', value: center ? `${radiusKm} km` : 'Not set', note: center ? 'Discovery area' : 'Add a location', color: 'text-sky-300' },
            { label: 'Events hosted', value: profile?.createdMeetups ?? 0, note: 'All time', color: 'text-amber-300' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className={`mt-2 text-2xl font-semibold tracking-tight ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-[11px] text-slate-600">{stat.note}</p>
            </div>
          ))}
        </section>
      ) : null}

      {loadError ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          {loadError}
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-slate-100">{query ? 'Matching events' : center ? 'Near you' : 'Upcoming events'}</h2><p className="mt-1 text-xs text-slate-600">{query ? `${nearby.length} result${nearby.length === 1 ? '' : 's'} found` : 'Curated from your preferences and location'}</p></div>
          {query ? <button type="button" onClick={() => navigate('/home')} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Clear search</button> : null}
        </div>
        {nearby.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-xl text-brand">⌕</span>
            <h3 className="mt-4 text-sm font-semibold text-slate-200">{query ? 'No matching events' : 'Your local calendar is open'}</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{query ? `Nothing matches “${query}” yet. Try a broader search.` : 'Be the person who brings the community together—host the first event in your area.'}</p>
            <Link to={query ? '/home' : '/meetups/new'} className="mt-5 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950">{query ? 'View all events' : 'Create an event'}</Link>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {nearby.map((m) => (
              <li key={m.id} className="h-full"><MeetupCard meetup={m} aiPick={aiSet.has(m.id)} distanceKm={center ? haversineKm(center, { lat: m.place.lat, lng: m.place.lng }) : undefined} /></li>
            ))}
          </ul>
        )}
      </section>

      {!query && allMeetups.length > 0 ? (
        <section className="space-y-4 border-t border-white/[0.06] pt-8">
          <div className="flex items-end justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-slate-100">Explore all</h2><p className="mt-1 text-xs text-slate-600">{aiIds.length > 0 ? 'Personalized matches appear first' : center ? 'Events beyond your discovery radius' : 'Everything happening in the community'}</p></div>
            <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-slate-500">{allMeetups.length}</span>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allMeetups.map((m) => (
              <li key={m.id} className="h-full"><MeetupCard meetup={m} aiPick={aiSet.has(m.id)} distanceKm={center ? haversineKm(center, { lat: m.place.lat, lng: m.place.lng }) : undefined} /></li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

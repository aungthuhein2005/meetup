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

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-100">
          {query ? `Results for “${query}”` : 'Nearby meetups'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {query
            ? `Matching title, tags, place, or description${
                center ? ` · within ${radiusKm} km` : ''
              }.`
            : center
              ? `Within ${radiusKm} km of your saved area.`
              : 'Add a saved location in your profile (onboarding) for tighter discovery.'}
        </p>
        {query ? (
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="mt-2 inline-flex rounded-lg border border-surface-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-surface-800"
          >
            Clear search
          </button>
        ) : null}
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {loadError}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-lg text-slate-100">
          {query ? 'Matching meetups' : center ? 'In your radius' : 'Upcoming'}
        </h2>
        {nearby.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-600 p-8 text-center">
            <p className="text-sm text-muted">
              {query
                ? `No meetups match “${query}”.`
                : 'No meetups match yet.'}
            </p>
            {query ? (
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950"
              >
                Clear search
              </button>
            ) : (
              <Link
                to="/meetups/new"
                className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950"
              >
                Host the first one
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {nearby.map((m) => (
              <li key={m.id}>
                <MeetupCard
                  meetup={m}
                  aiPick={aiSet.has(m.id)}
                  distanceKm={
                    center
                      ? haversineKm(center, {
                          lat: m.place.lat,
                          lng: m.place.lng,
                        })
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {!query && allMeetups.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-slate-100">For you</h2>
              <p className="text-xs text-muted">
                {aiIds.length > 0
                  ? 'AI-ranked picks first, then everything else happening.'
                  : center
                    ? 'All meetups — including ones outside your radius.'
                    : 'All active meetups.'}
              </p>
            </div>
            <span className="text-xs text-muted">{allMeetups.length}</span>
          </div>
          <ul className="space-y-3">
            {allMeetups.map((m) => (
              <li key={m.id}>
                <MeetupCard
                  meetup={m}
                  aiPick={aiSet.has(m.id)}
                  distanceKm={
                    center
                      ? haversineKm(center, {
                          lat: m.place.lat,
                          lng: m.place.lng,
                        })
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

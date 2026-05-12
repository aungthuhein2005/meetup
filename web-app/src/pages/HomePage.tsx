import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MeetupCard } from '../components/MeetupCard'
import { useAuth } from '../context/AuthContext'
import { isGeminiConfigured, rankMeetupsWithGemini } from '../services/gemini'
import { subscribeActiveMeetups } from '../services/meetups'
import type { Meetup } from '../types/models'
import { haversineKm } from '../utils/geo'

export function HomePage() {
  const { profile } = useAuth()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [aiIds, setAiIds] = useState<string[]>([])
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

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
    if (!center) {
      return [...meetups].sort(
        (a, b) => a.time.start.getTime() - b.time.start.getTime(),
      )
    }
    return [...meetups]
      .map((m) => ({
        m,
        d: haversineKm(center, { lat: m.place.lat, lng: m.place.lng }),
      }))
      .filter((x) => x.d <= radiusKm)
      .sort((a, b) => a.d - b.d)
      .map((x) => x.m)
  }, [meetups, center, radiusKm])

  const aiSet = useMemo(() => new Set(aiIds), [aiIds])

  const refreshAi = useCallback(async () => {
    if (!isGeminiConfigured() || !nearby.length) {
      setAiIds([])
      return
    }
    setAiBusy(true)
    setAiError(null)
    try {
      const ids = await rankMeetupsWithGemini({
        userInterests: profile?.interests ?? [],
        userLocationLabel: center
          ? `Within ~${radiusKm} km of ${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`
          : 'Location not set; rank by interests only.',
        meetups: nearby.map((m) => ({
          id: m.id,
          title: m.title,
          tags: m.tags,
          description: m.description,
        })),
      })
      setAiIds(ids)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI ranking failed.')
    } finally {
      setAiBusy(false)
    }
  }, [nearby, profile?.interests, center, radiusKm])

  useEffect(() => {
    if (!isGeminiConfigured() || !nearby.length) {
      setAiIds([])
      setAiBusy(false)
      return
    }
    setAiBusy(true)
    setAiError(null)
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
        .catch((e) => {
          if (!cancelled) {
            setAiError(e instanceof Error ? e.message : 'AI ranking failed.')
          }
        })
        .finally(() => {
          if (!cancelled) {
            setAiBusy(false)
          }
        })
    }, 500)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [nearby, profile?.interests, center, radiusKm])

  const aiPicks = useMemo(() => {
    const byId = new Map(meetups.map((m) => [m.id, m]))
    return aiIds.map((id) => byId.get(id)).filter((m): m is Meetup => Boolean(m))
  }, [aiIds, meetups])

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-100">
          Nearby meetups
        </h1>
        <p className="mt-1 text-sm text-muted">
          {center
            ? `Within ${radiusKm} km of your saved area.`
            : 'Add a saved location in your profile (onboarding) for tighter discovery.'}
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {loadError}
        </p>
      ) : null}

      {isGeminiConfigured() ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-slate-100">AI picks</h2>
              <p className="text-xs text-muted">
                Ranked for your interests{profile?.interests?.length ? '' : ' (add interests in profile)'}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshAi()}
              disabled={aiBusy || !nearby.length}
              className="shrink-0 rounded-lg border border-surface-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-surface-800 disabled:opacity-40"
            >
              {aiBusy ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {aiError ? (
            <p className="text-xs text-red-400">{aiError}</p>
          ) : null}
          {aiPicks.length === 0 && !aiBusy ? (
            <p className="text-sm text-muted">
              {nearby.length
                ? 'No AI ranking yet — try Refresh.'
                : 'Nothing in radius right now. Create one?'}
            </p>
          ) : (
            <ul className="space-y-3">
              {aiPicks.map((m) => (
                <li key={m.id}>
                  <MeetupCard meetup={m} aiPick />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="rounded-xl border border-surface-700 bg-surface-800/40 p-3 text-sm text-muted">
          Set <code className="text-brand">VITE_GEMINI_API_KEY</code> to enable personalized
          ranking.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg text-slate-100">
          {center ? 'In your radius' : 'Upcoming'}
        </h2>
        {nearby.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-600 p-8 text-center">
            <p className="text-sm text-muted">No meetups match yet.</p>
            <Link
              to="/meetups/new"
              className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950"
            >
              Host the first one
            </Link>
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
    </div>
  )
}

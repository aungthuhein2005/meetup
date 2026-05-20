import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createMeetup } from '../services/meetups'
import type { LatLng } from '../types/models'

type SeedInput = {
  title: string
  description: string
  tags: string[]
  placeName: string
  address: string
  offsetKm: { dx: number; dy: number }
  startOffsetHrs: number
  durationHrs: number
  maxParticipants: number
  locationSharingEnabled: boolean
  ticketingEnabled: boolean
}

const FALLBACK_CENTER: LatLng = { lat: 13.7563, lng: 100.5018 }

const SEEDS: SeedInput[] = [
  {
    title: 'Saturday coffee + side projects',
    description:
      'Bring a laptop or a notebook. Casual co-working with intros at 10:30. Open to anyone curious about building things.',
    tags: ['coffee', 'coworking', 'students'],
    placeName: 'Aroma Café',
    address: '2nd floor, by the window',
    offsetKm: { dx: 0.3, dy: 0.4 },
    startOffsetHrs: -0.5,
    durationHrs: 3,
    maxParticipants: 20,
    locationSharingEnabled: true,
    ticketingEnabled: false,
  },
  {
    title: 'ML study group: Transformers from scratch',
    description:
      'Whiteboard session on attention, positional encodings, and a tiny PyTorch impl. Beginner friendly.',
    tags: ['ML', 'study', 'pytorch'],
    placeName: 'Innovation Hub Room 3B',
    address: 'University Library wing',
    offsetKm: { dx: -0.4, dy: 0.6 },
    startOffsetHrs: 6,
    durationHrs: 2,
    maxParticipants: 15,
    locationSharingEnabled: false,
    ticketingEnabled: true,
  },
  {
    title: 'Pickup football, 5-a-side',
    description:
      'We rotate teams every 12 mins. Bring your own bib if you have one. Beginners welcome, no toxicity.',
    tags: ['football', 'sports', 'outdoors'],
    placeName: 'Riverside Sports Field',
    address: 'Field 2, near the parking entrance',
    offsetKm: { dx: 0.7, dy: -0.5 },
    startOffsetHrs: 26,
    durationHrs: 1.5,
    maxParticipants: 12,
    locationSharingEnabled: true,
    ticketingEnabled: true,
  },
  {
    title: 'Boba & board games',
    description:
      'Catan, Codenames, and Splendor on the table. Show up anytime in the window — we cycle players.',
    tags: ['boardgames', 'boba', 'social'],
    placeName: 'TeaLab',
    address: 'Corner of Maple & 3rd',
    offsetKm: { dx: -0.6, dy: -0.3 },
    startOffsetHrs: 30,
    durationHrs: 3,
    maxParticipants: 16,
    locationSharingEnabled: false,
    ticketingEnabled: false,
  },
  {
    title: 'Sunrise yoga at the park',
    description:
      'Bring a mat (we have a few spares). Gentle vinyasa flow, all levels. We finish before the heat kicks in.',
    tags: ['yoga', 'wellness', 'morning'],
    placeName: 'Central Park lawn',
    address: 'Near the east fountain',
    offsetKm: { dx: 0.5, dy: 0.2 },
    startOffsetHrs: 50,
    durationHrs: 1,
    maxParticipants: 25,
    locationSharingEnabled: false,
    ticketingEnabled: false,
  },
  {
    title: 'React + Tailwind meetup',
    description:
      'Three lightning talks: server components, Tailwind v4, and a demo of an app built in 48 hours. Drinks after.',
    tags: ['react', 'tailwind', 'webdev'],
    placeName: 'StackHaus',
    address: 'Top floor, ring the bell',
    offsetKm: { dx: -0.2, dy: 0.7 },
    startOffsetHrs: 96,
    durationHrs: 2.5,
    maxParticipants: 30,
    locationSharingEnabled: false,
    ticketingEnabled: true,
  },
  {
    title: 'Photography walk: golden hour',
    description:
      'Loop through the old town. Phone cameras welcome. Bring water — we walk ~3km at a slow pace.',
    tags: ['photography', 'walk', 'creative'],
    placeName: 'Old Town Plaza',
    address: 'Meet by the fountain',
    offsetKm: { dx: 0.8, dy: 0.6 },
    startOffsetHrs: 144,
    durationHrs: 2,
    maxParticipants: 14,
    locationSharingEnabled: true,
    ticketingEnabled: false,
  },
  {
    title: 'Pottery workshop (beginner)',
    description:
      'Hands-on session: wheel basics + glaze samples. Aprons provided. Cap is firm because of wheel count.',
    tags: ['pottery', 'workshop', 'art'],
    placeName: 'Clay & Kiln Studio',
    address: 'Lane 4, second door',
    offsetKm: { dx: -0.5, dy: -0.6 },
    startOffsetHrs: -26,
    durationHrs: 2,
    maxParticipants: 8,
    locationSharingEnabled: false,
    ticketingEnabled: true,
  },
]

function offsetLatLng(
  center: LatLng,
  dxKm: number,
  dyKm: number,
): { lat: number; lng: number } {
  const dLat = dyKm / 110.574
  const dLng = dxKm / (111.32 * Math.cos((center.lat * Math.PI) / 180))
  return {
    lat: Number((center.lat + dLat).toFixed(6)),
    lng: Number((center.lng + dLng).toFixed(6)),
  }
}

export function DevSeedPage() {
  const { user, profile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<
    { title: string; id?: string; error?: string }[]
  >([])

  const center = profile?.location ?? FALLBACK_CENTER

  async function seedAll() {
    if (!user) {
      return
    }
    setBusy(true)
    setResults([])
    const now = Date.now()
    const all: { title: string; id?: string; error?: string }[] = []
    for (const seed of SEEDS) {
      try {
        const place = offsetLatLng(center, seed.offsetKm.dx, seed.offsetKm.dy)
        const start = new Date(now + seed.startOffsetHrs * 60 * 60 * 1000)
        const end = new Date(
          start.getTime() + seed.durationHrs * 60 * 60 * 1000,
        )
        const id = await createMeetup({
          title: seed.title,
          description: seed.description,
          tags: seed.tags,
          creatorId: user.uid,
          place: {
            name: seed.placeName,
            address: seed.address,
            lat: place.lat,
            lng: place.lng,
          },
          time: { start, end },
          maxParticipants: seed.maxParticipants,
          locationSharingEnabled: seed.locationSharingEnabled,
          ticketingEnabled: seed.ticketingEnabled,
        })
        all.push({ title: seed.title, id })
      } catch (e) {
        all.push({
          title: seed.title,
          error: e instanceof Error ? e.message : 'Failed',
        })
      }
      setResults([...all])
    }
    setBusy(false)
  }

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="font-display text-2xl font-semibold text-slate-100">
          Demo seeder
        </h1>
        <p className="mt-1 text-sm text-muted">
          Creates 8 demo meetups around{' '}
          {profile?.location
            ? 'your saved location'
            : `the fallback center (${FALLBACK_CENTER.lat}, ${FALLBACK_CENTER.lng})`}
          . Mix of live / upcoming / past, ticketed and casual.
        </p>
      </header>

      <div className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4 text-sm">
        <p className="text-slate-200">
          Center:{' '}
          <code className="text-brand">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </code>
        </p>
        <p className="mt-1 text-muted">
          Each event is scattered within ~1 km of that center. Creator: you (
          <code className="text-brand">{user?.uid?.slice(0, 8)}…</code>).
        </p>
      </div>

      <button
        type="button"
        disabled={busy || !user}
        onClick={() => void seedAll()}
        className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface-950 disabled:opacity-50"
      >
        {busy ? 'Seeding…' : `Seed ${SEEDS.length} demo meetups`}
      </button>

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.title}
              className={`rounded-xl border p-3 text-sm ${
                r.error
                  ? 'border-red-900/50 bg-red-950/30 text-red-300'
                  : 'border-surface-700 bg-surface-800/40 text-slate-200'
              }`}
            >
              {r.error ? (
                <>
                  <span className="font-medium">{r.title}</span> — {r.error}
                </>
              ) : (
                <>
                  <span className="font-medium">{r.title}</span>{' '}
                  <Link
                    to={`/meetups/${r.id}`}
                    className="ml-2 text-xs text-brand hover:underline"
                  >
                    open ↗
                  </Link>
                </>
              )}
            </li>
          ))}
          {!busy ? (
            <li className="pt-2 text-xs text-muted">
              Done — head to{' '}
              <Link to="/home" className="text-brand hover:underline">
                Nearby
              </Link>{' '}
              or{' '}
              <Link to="/me" className="text-brand hover:underline">
                My events
              </Link>{' '}
              to see them.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}

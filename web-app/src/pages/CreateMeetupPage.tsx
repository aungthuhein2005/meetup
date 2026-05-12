import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createMeetup } from '../services/meetups'
import { parseInterestInput } from '../utils/geo'

export function CreateMeetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!user) {
    return null
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not available.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude))
        setLng(String(pos.coords.longitude))
        setError(null)
      },
      () => setError('Could not read device location.'),
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const latN = Number(lat)
    const lngN = Number(lng)
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
      setError('Please set latitude and longitude (use current location or maps).')
      return
    }
    if (!start || !end) {
      setError('Pick start and end time.')
      return
    }
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (endDate <= startDate) {
      setError('End time must be after start time.')
      return
    }
    setBusy(true)
    try {
      const id = await createMeetup({
        title: title.trim(),
        description: description.trim(),
        tags: parseInterestInput(tagsRaw),
        creatorId: user.uid,
        place: {
          name: placeName.trim() || 'Meetup spot',
          lat: latN,
          lng: lngN,
          address: address.trim() || placeName.trim() || 'Address TBD',
        },
        time: { start: startDate, end: endDate },
        maxParticipants,
        locationSharingEnabled,
      })
      navigate(`/meetups/${id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create meetup.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-24">
      <h1 className="font-display text-2xl font-semibold text-slate-100">
        Create meetup
      </h1>
      <p className="mt-1 text-sm text-muted">
        Title, time, and place are shared with participants. Live location is optional per PRD.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Title
          </span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Description
          </span>
          <textarea
            required
            className="mt-1 min-h-[100px] w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Tags
          </span>
          <input
            className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="study, coffee, ML"
          />
        </label>

        <div className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4">
          <p className="text-sm font-medium text-slate-200">Place</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs text-muted">Venue name</span>
              <input
                className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2 text-slate-100 outline-none ring-brand/30 focus:ring-2"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-muted">Address</span>
              <input
                className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2 text-slate-100 outline-none ring-brand/30 focus:ring-2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Latitude</span>
              <input
                className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none ring-brand/30 focus:ring-2"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Longitude</span>
              <input
                className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none ring-brand/30 focus:ring-2"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => useMyLocation()}
            className="mt-3 rounded-xl border border-surface-600 px-3 py-2 text-sm text-slate-200 hover:bg-surface-700"
          >
            Use current location for coordinates
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Start
            </span>
            <input
              type="datetime-local"
              required
              className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              End
            </span>
            <input
              type="datetime-local"
              required
              className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Max participants
          </span>
          <input
            type="number"
            min={2}
            max={500}
            className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
          />
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-surface-700 bg-surface-900/60 px-3 py-3">
          <input
            type="checkbox"
            checked={locationSharingEnabled}
            onChange={(e) => setLocationSharingEnabled(e.target.checked)}
            className="size-4 accent-brand"
          />
          <span className="text-sm text-slate-200">
            Allow optional live location during the event (participants opt in).
          </span>
        </label>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-surface-950 disabled:opacity-50"
        >
          {busy ? 'Publishing…' : 'Publish meetup'}
        </button>
      </form>
    </div>
  )
}

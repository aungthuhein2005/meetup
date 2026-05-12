import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { saveUserOnboarding } from '../services/users'
import { parseInterestInput } from '../utils/geo'

export function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(profile?.name ?? '')
  const [interestsRaw, setInterestsRaw] = useState(
    profile?.interests?.join(', ') ?? '',
  )
  const [radiusKm, setRadiusKm] = useState(profile?.radiusKm ?? 5)
  const [locStatus, setLocStatus] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    profile?.location ?? null,
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!user) {
    return null
  }

  if (profile?.onboardingComplete) {
    return <Navigate to="/" replace />
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocStatus('Geolocation is not available in this browser.')
      return
    }
    setLocStatus('Locating…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('Saved approximate position for discovery.')
      },
      () => {
        setLocStatus('Could not read location. You can still continue.')
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const interests = parseInterestInput(interestsRaw)
      await saveUserOnboarding(user.uid, {
        name: name.trim() || 'Member',
        interests,
        location: coords,
        radiusKm,
      })
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-24">
      <h1 className="font-display text-2xl font-semibold text-slate-100">
        Your preferences
      </h1>
      <p className="mt-2 text-sm text-muted">
        Interests power AI recommendations. Location is optional and used only
        for nearby discovery.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-6">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Display name
          </span>
          <input
            className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Interests (comma separated)
          </span>
          <textarea
            className="mt-1 min-h-[88px] w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={interestsRaw}
            onChange={(e) => setInterestsRaw(e.target.value)}
            placeholder="AI, study groups, hiking…"
          />
        </label>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Discovery radius
            </span>
            <span className="text-sm text-slate-300">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="mt-3 w-full accent-brand"
          />
        </div>

        <div className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4">
          <p className="text-sm font-medium text-slate-200">Approximate location</p>
          <p className="mt-1 text-xs text-muted">
            Optional. You can clear by continuing without capturing.
          </p>
          {coords ? (
            <p className="mt-2 font-mono text-xs text-slate-400">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => captureLocation()}
              className="rounded-xl border border-surface-600 px-3 py-2 text-sm text-slate-200 hover:bg-surface-700"
            >
              Use device location
            </button>
            <button
              type="button"
              onClick={() => {
                setCoords(null)
                setLocStatus('Location cleared.')
              }}
              className="rounded-xl px-3 py-2 text-sm text-muted hover:text-slate-200"
            >
              Clear
            </button>
          </div>
          {locStatus ? (
            <p className="mt-2 text-xs text-slate-400">{locStatus}</p>
          ) : null}
        </div>

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
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}

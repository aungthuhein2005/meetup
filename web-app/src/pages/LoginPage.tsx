import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'

export function LoginPage() {
  const { firebaseReady, user, profile, loading, signInEmail, signUpEmail } =
    useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)
    ?.from?.pathname

  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!isFirebaseConfigured()) {
    return <Navigate to="/" replace />
  }

  if (!loading && user) {
    if (profile?.onboardingComplete) {
      return <Navigate to={from && from !== '/login' ? from : '/'} replace />
    }
    return <Navigate to="/onboarding" replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'in') {
        await signInEmail(email.trim(), password)
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your name.')
        }
        await signUpEmail(name.trim(), email.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (!firebaseReady) {
    return null
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-brand">MeetToTalk</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to discover and coordinate real-world meetups.
      </p>

      <div className="mt-8 flex rounded-xl border border-surface-700 bg-surface-900 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === 'in' ? 'bg-surface-800 text-slate-100' : 'text-muted'
          }`}
          onClick={() => setMode('in')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === 'up' ? 'bg-surface-800 text-slate-100' : 'text-muted'
          }`}
          onClick={() => setMode('up')}
        >
          Register
        </button>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        {mode === 'up' ? (
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Name
            </span>
            <input
              className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Email
          </span>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Password
          </span>
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 text-slate-100 outline-none ring-brand/30 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          />
        </label>
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || loading}
          className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-surface-950 disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-muted">
        By continuing you agree to respect community safety and optional location
        sharing rules described in the product brief.
      </p>
      <p className="mt-4 text-center text-sm text-muted">
        <Link to="/" className="text-brand hover:underline">
          Back to app
        </Link>
      </p>
    </div>
  )
}

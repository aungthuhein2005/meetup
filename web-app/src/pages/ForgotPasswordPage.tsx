import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'

type Status =
  | { kind: 'idle' }
  | { kind: 'sent' }
  | { kind: 'error'; text: string }

export function ForgotPasswordPage() {
  const { firebaseReady, sendPasswordReset } = useAuth()
  const location = useLocation()
  const prefill =
    (location.state as { email?: string } | null)?.email?.toString() ?? ''

  const [email, setEmail] = useState(prefill)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [busy, setBusy] = useState(false)

  if (!isFirebaseConfigured()) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus({ kind: 'idle' })
    try {
      await sendPasswordReset(email)
      setStatus({ kind: 'sent' })
    } catch (err) {
      setStatus({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Could not send reset email.',
      })
    } finally {
      setBusy(false)
    }
  }

  if (!firebaseReady) {
    return null
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-brand">
        Reset password
      </h1>
      <p className="mt-2 text-sm text-muted">
        Enter the email you used to sign up. We&apos;ll send you a link to choose
        a new password.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
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

        {status.kind === 'error' ? (
          <p className="text-sm text-red-400" role="alert">
            {status.text}
          </p>
        ) : null}
        {status.kind === 'sent' ? (
          <p
            className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-3 text-sm text-emerald-300"
            role="status"
          >
            Reset link sent. Check your inbox (and spam folder).
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-surface-950 disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{' '}
        <Link to="/login" className="text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

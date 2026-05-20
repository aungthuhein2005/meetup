import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'

export function SetupGate() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-brand">
        MeetToTalk
      </h1>
      <p className="text-muted leading-relaxed">
        Copy <code className="text-brand">web-app/.env.example</code> to{' '}
        <code className="text-brand">web-app/.env</code> and add your Firebase
        web app keys. Optionally set <code className="text-brand">VITE_GEMINI_API_KEY</code>{' '}
        for AI recommendations and the assistant.
      </p>
    </div>
  )
}

export function AuthLayout() {
  const { firebaseReady, user, loading } = useAuth()
  const location = useLocation()

  if (!isFirebaseConfigured()) {
    return <SetupGate />
  }

  if (!firebaseReady) {
    return <SetupGate />
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function OnboardingGuard() {
  const { profile } = useAuth()

  if (!profile?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

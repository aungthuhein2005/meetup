import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-dim text-brand' : 'text-muted hover:text-slate-200',
  ].join(' ')

export function AppShell() {
  const { signOutUser, profile } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b border-surface-700 bg-surface-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <NavLink
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-brand"
          >
            MeetToTalk
          </NavLink>
          {profile ? (
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="text-sm text-muted hover:text-slate-200"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>

      {profile?.onboardingComplete ? (
        <nav className="sticky bottom-0 border-t border-surface-700 bg-surface-900/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl justify-around px-2 py-2">
            <NavLink to="/" className={linkClass} end>
              Nearby
            </NavLink>
            <NavLink to="/meetups/new" className={linkClass}>
              Create
            </NavLink>
            <NavLink to="/assistant" className={linkClass}>
              Assistant
            </NavLink>
          </div>
        </nav>
      ) : null}
    </div>
  )
}

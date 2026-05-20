import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HeaderSearch } from './HeaderSearch'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-dim text-brand' : 'text-muted hover:text-slate-200',
  ].join(' ')

export function AppShell() {
  const { signOutUser, profile } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-surface-700 bg-surface-900/95 shadow-[0_2px_12px_rgba(0,0,0,0.25)] backdrop-blur supports-backdrop-filter:bg-surface-900/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <NavLink
            to="/home"
            className="shrink-0 font-display text-lg font-semibold tracking-tight text-brand"
          >
            MeetToTalk
          </NavLink>
          {profile?.onboardingComplete ? <HeaderSearch /> : <div className="flex-1" />}
          {profile ? (
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="shrink-0 text-sm text-muted hover:text-slate-200"
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
        <nav className="sticky bottom-0 z-30 border-t border-surface-700 bg-surface-900/95 backdrop-blur supports-backdrop-filter:bg-surface-900/80">
          <div className="mx-auto flex max-w-2xl justify-around px-2 py-2">
            <NavLink to="/home" className={linkClass} end>
              Nearby
            </NavLink>
            <NavLink to="/me" className={linkClass}>
              My
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

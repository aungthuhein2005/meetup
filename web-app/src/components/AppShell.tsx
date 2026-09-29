import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HeaderSearch } from './HeaderSearch'

const navItems = [
  { to: '/home', label: 'Discover', icon: 'compass', end: true },
  { to: '/me', label: 'My events', icon: 'calendar' },
  { to: '/meetups/new', label: 'Create event', icon: 'plus' },
  { to: '/assistant', label: 'AI assistant', icon: 'sparkle' },
] as const

function Icon({ name }: { name: (typeof navItems)[number]['icon'] | 'logout' }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/></>,
    sparkle: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></>,
  }
  return <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative block shrink-0 overflow-hidden rounded-xl bg-brand/10 ring-1 ring-brand/15 ${compact ? 'size-8' : 'size-9'}`}
    >
      <img
        src="/logo2.png"
        alt=""
        className={`pointer-events-none absolute max-w-none ${compact ? '-left-[31px] -top-[27px] w-[90px]' : '-left-[34px] -top-[31px] w-[104px]'}`}
      />
    </span>
  )
}

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand/[0.12] text-brand ring-1 ring-inset ring-brand/15' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'}`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition ${isActive ? 'text-brand' : 'text-slate-500 hover:text-slate-200'}`

export function AppShell() {
  const { signOutUser, profile } = useAuth()
  const initials = profile?.name
    ? profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : 'MT'

  return (
    <div className="min-h-svh bg-surface-950 lg:flex">
      {profile?.onboardingComplete ? (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-surface-900/70 px-4 py-5 backdrop-blur-xl lg:flex">
          <NavLink to="/home" className="flex items-center gap-3 px-2">
            <BrandMark />
            <div><p className="text-[15px] font-semibold tracking-tight text-white">MeetToTalk</p><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Community OS</p></div>
          </NavLink>
          <nav className="mt-9 space-y-1" aria-label="Primary navigation">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</p>
            {navItems.map((item) => <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false} className={desktopLinkClass}><Icon name={item.icon} />{item.label}</NavLink>)}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
            <div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand ring-1 ring-brand/20">{initials}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{profile.name || 'Your account'}</p><p className="truncate text-xs text-slate-500">{profile.email}</p></div></div>
            <button type="button" onClick={() => void signOutUser()} className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"><Icon name="logout" /> Sign out</button>
          </div>
        </aside>
      ) : null}

      <div className={`flex min-h-svh min-w-0 flex-1 flex-col ${profile?.onboardingComplete ? 'lg:pl-64' : ''}`}>
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-950/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <NavLink to="/home" className="flex shrink-0 items-center gap-2 lg:hidden"><BrandMark compact /><span className="hidden text-sm font-semibold text-white sm:block">MeetToTalk</span></NavLink>
            {profile?.onboardingComplete ? <HeaderSearch /> : <div className="flex-1" />}
            {profile?.onboardingComplete ? <NavLink to="/meetups/new" className="hidden shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950 shadow-[0_8px_24px_rgba(45,212,191,0.14)] transition hover:bg-teal-300 sm:flex lg:hidden"><span className="text-lg leading-none">+</span> New event</NavLink> : null}
            {profile ? <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-800 text-xs font-bold text-brand ring-1 ring-white/10 lg:hidden">{initials}</span> : null}
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"><Outlet /></main>

        {profile?.onboardingComplete ? (
          <nav className="sticky bottom-0 z-30 border-t border-white/[0.07] bg-surface-900/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-lg justify-around">{navItems.map((item) => <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false} className={mobileLinkClass}><Icon name={item.icon} />{item.label.replace(' events', '').replace(' event', '').replace('AI ', '')}</NavLink>)}</div>
          </nav>
        ) : null}
      </div>
    </div>
  )
}

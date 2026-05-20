import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export function HeaderSearch() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initial = params.get('q') ?? ''
  const [value, setValue] = useState(initial)

  // Keep input in sync if URL changes externally (back/forward navigation).
  useEffect(() => {
    setValue(params.get('q') ?? '')
  }, [params])

  // Debounce updates to the URL.
  useEffect(() => {
    const trimmed = value.trim()
    const current = params.get('q') ?? ''
    if (trimmed === current) {
      return
    }
    const t = window.setTimeout(() => {
      if (location.pathname !== '/home') {
        navigate(
          trimmed ? `/home?q=${encodeURIComponent(trimmed)}` : '/home',
          { replace: false },
        )
        return
      }
      const next = new URLSearchParams(params)
      if (trimmed) {
        next.set('q', trimmed)
      } else {
        next.delete('q')
      }
      navigate(
        { pathname: '/home', search: next.toString() ? `?${next}` : '' },
        { replace: true },
      )
    }, 200)
    return () => window.clearTimeout(t)
  }, [value, params, navigate, location.pathname])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    navigate(trimmed ? `/home?q=${encodeURIComponent(trimmed)}` : '/home')
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="relative flex-1 max-w-md"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted"
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search meetups…"
        aria-label="Search meetups"
        className="w-full rounded-xl border border-surface-700 bg-surface-900 py-1.5 pl-9 pr-8 text-sm text-slate-100 outline-none ring-brand/30 placeholder:text-muted focus:ring-2"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 text-sm text-muted hover:text-slate-200"
        >
          ×
        </button>
      ) : null}
    </form>
  )
}

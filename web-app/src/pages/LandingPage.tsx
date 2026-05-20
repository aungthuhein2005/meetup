import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Feature = {
  icon: string
  title: string
  body: string
}

const FEATURES: Feature[] = [
  {
    icon: '📍',
    title: 'Nearby discovery',
    body: 'See meetups happening around your saved area — filter by radius, tags, or keyword.',
  },
  {
    icon: '✨',
    title: 'AI for-you picks',
    body: 'Gemini ranks events that match your interests so the right meetups float up.',
  },
  {
    icon: '🎟️',
    title: 'Tickets, or not',
    body: 'Issue scannable QR codes for organized events — or turn them off for casual hangouts.',
  },
  {
    icon: '🧭',
    title: 'Map + directions',
    body: 'Interactive map shows the venue and your location. One tap launches Google Maps.',
  },
  {
    icon: '🛰️',
    title: 'Opt-in live location',
    body: 'Optionally share your live spot during the event window so friends can find you.',
  },
  {
    icon: '🔗',
    title: 'Share with a link',
    body: 'Every meetup has a public landing page + QR. Friends preview before they sign in.',
  },
]

const STEPS = [
  {
    n: '1',
    title: 'Create your profile',
    body: 'Tell us your interests and where you usually hang out.',
  },
  {
    n: '2',
    title: 'Browse or host',
    body: 'Find a meetup nearby or publish your own in under a minute.',
  },
  {
    n: '3',
    title: 'Meet & check in',
    body: 'Scan QR tickets at the door, or just show up if it’s a casual gathering.',
  },
]

export function LandingPage() {
  const { user, profile } = useAuth()
  const isAuthed = Boolean(user)
  const firstName = profile?.name?.split(' ')[0]

  return (
    <div className="min-h-svh bg-surface-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-surface-800/60 bg-surface-950/85 backdrop-blur supports-backdrop-filter:bg-surface-950/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-brand"
          >
            MeetToTalk
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {isAuthed ? (
              <Link
                to="/home"
                className="rounded-lg bg-brand px-3 py-1.5 font-medium text-surface-950 hover:brightness-110"
              >
                Open app
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-1.5 text-muted hover:text-slate-100"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  state={{ mode: 'up' }}
                  className="rounded-lg bg-brand px-3 py-1.5 font-medium text-surface-950 hover:brightness-110"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
        <section className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="hero-anim-grid" />
            <span
              className="hero-anim-blob"
              style={{
                top: '-12%',
                left: '-8%',
                width: '36rem',
                height: '36rem',
                background:
                  'radial-gradient(circle, rgba(45,212,191,0.35) 0%, rgba(45,212,191,0) 70%)',
                animation: 'blob-drift-a 16s ease-in-out infinite',
              }}
            />
            <span
              className="hero-anim-blob"
              style={{
                bottom: '-18%',
                right: '-10%',
                width: '32rem',
                height: '32rem',
                background:
                  'radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(245,158,11,0) 70%)',
                animation: 'blob-drift-b 20s ease-in-out infinite',
              }}
            />
            <span
              className="hero-anim-blob"
              style={{
                top: '40%',
                left: '38%',
                width: '22rem',
                height: '22rem',
                background:
                  'radial-gradient(circle, rgba(17,94,89,0.55) 0%, rgba(17,94,89,0) 70%)',
                animation: 'blob-drift-c 24s ease-in-out infinite',
              }}
            />
            <span
              className="hero-anim-spark absolute size-1.5 rounded-full bg-brand/70"
              style={{
                top: '20%',
                left: '12%',
                animation: 'spark-twinkle 3.5s ease-in-out infinite',
                boxShadow: '0 0 12px rgba(45,212,191,0.7)',
              }}
            />
            <span
              className="hero-anim-spark absolute size-1 rounded-full bg-accent/80"
              style={{
                top: '70%',
                left: '24%',
                animation: 'spark-twinkle 4.2s ease-in-out infinite 0.6s',
                boxShadow: '0 0 10px rgba(245,158,11,0.6)',
              }}
            />
            <span
              className="hero-anim-spark absolute size-1 rounded-full bg-brand/70"
              style={{
                top: '32%',
                right: '8%',
                animation: 'spark-twinkle 3s ease-in-out infinite 1.4s',
                boxShadow: '0 0 10px rgba(45,212,191,0.6)',
              }}
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              Real-world meetups, near you
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
              Skip the small talk.
              <br />
              <span className="text-brand">Meet people nearby.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              MeetToTalk helps you discover meetups around you, share them with
              one link, and run a smooth event — tickets optional. Built for
              campuses, communities, and spontaneous hangouts.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {isAuthed ? (
                <>
                  <Link
                    to="/home"
                    className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface-950 hover:brightness-110"
                  >
                    {firstName ? `Continue as ${firstName}` : 'Open dashboard'}
                  </Link>
                  <Link
                    to="/meetups/new"
                    className="rounded-xl border border-surface-700 bg-surface-900 px-5 py-3 text-sm font-medium text-slate-100 hover:bg-surface-800"
                  >
                    Host a meetup
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    state={{ mode: 'up' }}
                    className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface-950 hover:brightness-110"
                  >
                    Create free account
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-xl border border-surface-700 bg-surface-900 px-5 py-3 text-sm font-medium text-slate-100 hover:bg-surface-800"
                  >
                    I already have one
                  </Link>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-muted">
              No spam. We share your live location only when you turn it on.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-linear-to-br from-brand/25 via-brand/5 to-accent/10 blur-2xl" />
            <div className="rounded-3xl border border-surface-700 bg-surface-900/80 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  Live now
                </span>
                <span className="text-xs text-muted">0.3 km</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-medium text-slate-100">
                Saturday coffee + side-projects
              </h3>
              <p className="mt-1 text-sm text-muted">
                Bring a laptop or a notebook. Casual co-working with intros at
                10:30.
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {['coffee', 'coworking', 'students'].map((t) => (
                  <li
                    key={t}
                    className="rounded-md bg-surface-700 px-2 py-0.5 text-slate-300"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>📍 Aroma Café · 2nd floor</span>
                <span>9/20 going</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-700/60">
                <div className="h-full w-[45%] rounded-full bg-brand" />
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-surface-700 bg-surface-900/80 p-3 text-xs text-muted">
              <p className="text-slate-200">
                <span className="font-semibold text-brand">✨ For you</span> —
                ranked by your interests in <em>coffee</em> &amp;{' '}
                <em>side projects</em>.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-slate-100 sm:text-3xl">
            Everything you need to run a meetup
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            From discovery to door — designed for the kind of small, real-world
            gatherings most apps make awkward.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-surface-700 bg-surface-900/60 p-5 transition hover:border-brand/40"
              >
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-3 font-display text-base font-medium text-slate-100">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-slate-100 sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="relative rounded-2xl border border-surface-700 bg-surface-900/60 p-5"
              >
                <span className="absolute -top-3 left-4 inline-flex size-7 items-center justify-center rounded-full bg-brand text-sm font-semibold text-surface-950">
                  {s.n}
                </span>
                <h3 className="mt-3 font-display text-base font-medium text-slate-100">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-20 rounded-3xl border border-brand/30 bg-linear-to-br from-brand/15 via-surface-900/40 to-accent/10 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-semibold text-slate-100 sm:text-3xl">
            Ready to host or join your next meetup?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            It takes less than a minute. Bring a notebook, bring a friend, bring
            both.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {isAuthed ? (
              <Link
                to="/home"
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface-950 hover:brightness-110"
              >
                Browse nearby
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ mode: 'up' }}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface-950 hover:brightness-110"
              >
                Sign up — it’s free
              </Link>
            )}
            <Link
              to="/assistant"
              className="rounded-xl border border-surface-700 bg-surface-900 px-5 py-3 text-sm font-medium text-slate-100 hover:bg-surface-800"
            >
              Ask the assistant
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-800/60 py-8 text-center text-xs text-muted">
        <p>
          Built with{' '}
          <span className="font-display text-brand">MeetToTalk</span> · Real
          meetups, real people.
        </p>
      </footer>
    </div>
  )
}

import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { Meetup } from '../types/models'
import { getMeetupStatus, type MeetupStatus } from '../utils/meetupStatus'

type Props = {
  meetup: Meetup
  distanceKm?: number
  aiPick?: boolean
}

const STATUS_STYLES: Record<MeetupStatus, { label: string; className: string }> = {
  live: {
    label: 'Live now',
    className: 'bg-emerald-500/20 text-emerald-300',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-brand/20 text-brand',
  },
  ended: {
    label: 'Ended',
    className: 'bg-surface-700 text-slate-400',
  },
}

export function MeetupCard({ meetup, distanceKm, aiPick }: Props) {
  const status = getMeetupStatus(meetup)
  const statusStyle = STATUS_STYLES[status]
  const isEnded = status === 'ended'
  return (
    <Link
      to={`/meetups/${meetup.id}`}
      className={`group block rounded-2xl border border-surface-700 bg-surface-800/60 p-4 transition hover:border-brand/40 hover:bg-surface-800 ${
        isEnded ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle.className}`}
            >
              {statusStyle.label}
            </span>
            {aiPick ? (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                For you
              </span>
            ) : null}
            <h2
              className={`font-display text-lg font-medium group-hover:text-brand ${
                isEnded ? 'text-slate-300' : 'text-slate-100'
              }`}
            >
              {meetup.title}
            </h2>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{meetup.description}</p>
          <p className="mt-2 text-xs text-slate-400">
            {format(meetup.time.start, 'EEE d MMM · HH:mm')} –{' '}
            {format(meetup.time.end, 'HH:mm')}
          </p>
          <p className="mt-1 text-xs text-slate-500">{meetup.place.name}</p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted">
          {typeof distanceKm === 'number' ? (
            <span className="block font-medium text-slate-300">
              {distanceKm < 1
                ? `${Math.round(distanceKm * 1000)} m`
                : `${distanceKm.toFixed(1)} km`}
            </span>
          ) : null}
          <span className="mt-1 block">
            {meetup.participantCount}/{meetup.maxParticipants}
          </span>
        </div>
      </div>
      {meetup.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {meetup.tags.map((t) => (
            <li
              key={t}
              className="rounded-md bg-surface-700 px-2 py-0.5 text-xs text-slate-300"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  )
}

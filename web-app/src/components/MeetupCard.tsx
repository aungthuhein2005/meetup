import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { Meetup } from '../types/models'
import { getMeetupStatus, type MeetupStatus } from '../utils/meetupStatus'

type Props = { meetup: Meetup; distanceKm?: number; aiPick?: boolean }

const STATUS_STYLES: Record<MeetupStatus, { label: string; className: string; dot: string }> = {
  live: { label: 'Live now', className: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20', dot: 'bg-emerald-400' },
  upcoming: { label: 'Upcoming', className: 'bg-brand/10 text-brand ring-brand/20', dot: 'bg-brand' },
  ended: { label: 'Ended', className: 'bg-white/[0.04] text-slate-500 ring-white/[0.07]', dot: 'bg-slate-600' },
}

export function MeetupCard({ meetup, distanceKm, aiPick }: Props) {
  const status = getMeetupStatus(meetup)
  const style = STATUS_STYLES[status]
  const capacity = Math.min(100, Math.round((meetup.participantCount / meetup.maxParticipants) * 100))
  return (
    <Link to={`/meetups/${meetup.id}`} className={`group flex h-full flex-col rounded-2xl border border-white/[0.07] bg-surface-900/65 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-surface-900 ${status === 'ended' ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset ${style.className}`}><span className={`size-1.5 rounded-full ${style.dot}`} />{style.label}</span>
        {aiPick ? <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-300 ring-1 ring-inset ring-amber-400/20">✦ Matched</span> : null}
      </div>
      <h3 className="mt-4 line-clamp-2 text-[17px] font-semibold leading-snug text-slate-100 transition group-hover:text-brand">{meetup.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{meetup.description}</p>
      <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-xs text-slate-400">
        <p className="flex items-center gap-2"><span className="text-slate-600">◷</span>{format(meetup.time.start, 'EEE, d MMM · HH:mm')}–{format(meetup.time.end, 'HH:mm')}</p>
        <p className="flex items-center gap-2"><span className="text-slate-600">⌖</span><span className="truncate">{meetup.place.name}</span>{typeof distanceKm === 'number' ? <span className="ml-auto shrink-0 text-slate-500">{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}</span> : null}</p>
      </div>
      <div className="mt-auto pt-5">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500"><span>{meetup.participantCount} attending</span><span>{Math.max(0, meetup.maxParticipants - meetup.participantCount)} spots left</span></div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-brand/70" style={{ width: `${capacity}%` }} /></div>
        {meetup.tags.length ? <ul className="mt-4 flex flex-wrap gap-1.5">{meetup.tags.slice(0, 3).map((tag) => <li key={tag} className="rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400">#{tag}</li>)}</ul> : null}
      </div>
    </Link>
  )
}

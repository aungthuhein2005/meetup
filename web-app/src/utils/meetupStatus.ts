import type { Meetup } from '../types/models'

export type MeetupStatus = 'live' | 'upcoming' | 'ended'

export function getMeetupStatus(meetup: Meetup, now: Date = new Date()): MeetupStatus {
  const t = now.getTime()
  if (t > meetup.time.end.getTime()) {
    return 'ended'
  }
  if (t >= meetup.time.start.getTime()) {
    return 'live'
  }
  return 'upcoming'
}

const STATUS_ORDER: Record<MeetupStatus, number> = {
  live: 0,
  upcoming: 1,
  ended: 2,
}

export function compareByStatusThen<T>(
  getMeetup: (item: T) => Meetup,
  fallback: (a: T, b: T) => number,
  now: Date = new Date(),
): (a: T, b: T) => number {
  return (a, b) => {
    const sa = STATUS_ORDER[getMeetupStatus(getMeetup(a), now)]
    const sb = STATUS_ORDER[getMeetupStatus(getMeetup(b), now)]
    if (sa !== sb) {
      return sa - sb
    }
    return fallback(a, b)
  }
}

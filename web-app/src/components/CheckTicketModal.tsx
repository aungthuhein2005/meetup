import { useEffect } from 'react'
import { OrganizerCheckInCard } from './OrganizerCheckInCard'

type Props = {
  open: boolean
  meetupId: string
  organizerUid: string
  onClose: () => void
}

export function CheckTicketModal({
  open,
  meetupId,
  organizerUid,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) {
      return
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Check ticket"
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 px-4 py-6 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative z-10 max-h-[88svh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-700 bg-surface-900/95 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-surface-700 bg-surface-900/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span aria-hidden>🎟</span>
            <h2 className="font-display text-base font-semibold text-slate-100">
              Check ticket
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-surface-700"
          >
            Close
          </button>
        </div>
        <div className="px-4 py-4">
          <OrganizerCheckInCard
            meetupId={meetupId}
            organizerUid={organizerUid}
          />
        </div>
      </div>
    </div>
  )
}

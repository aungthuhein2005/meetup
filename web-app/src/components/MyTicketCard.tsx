import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { ParticipantPass } from '../types/models'

type Props = {
  pass: ParticipantPass
}

export function MyTicketCard({ pass }: Props) {
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!showQr) {
      return
    }
    let cancelled = false
    setQrError(null)
    void QRCode.toDataURL(pass.code, {
      width: 220,
      margin: 2,
      color: { dark: '#0f172a', light: '#f8fafc' },
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError('Could not generate QR code.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [pass.code, showQr])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(pass.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="rounded-2xl border border-brand/40 bg-linear-to-br from-surface-900/80 to-surface-800/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-lg">
            🎟
          </span>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Your ticket
          </h2>
        </div>
        {pass.checkedIn ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
            ✓ Checked in
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
            Pending
          </span>
        )}
      </div>

      <p className="mt-3 font-mono text-2xl font-semibold tracking-[0.18em] text-brand">
        {pass.code}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyCode()}
          className="inline-flex items-center gap-1 rounded-xl bg-surface-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-surface-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-surface-950"
        >
          {showQr ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {showQr ? (
        <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Your ticket QR code"
              width={220}
              height={220}
              className="size-[220px]"
            />
          ) : qrError ? (
            <p className="flex size-[220px] items-center justify-center px-2 text-center text-xs text-slate-600">
              {qrError}
            </p>
          ) : (
            <div
              className="size-[220px] animate-pulse rounded-lg bg-slate-200"
              aria-hidden
            />
          )}
        </div>
      ) : null}

      {pass.checkedIn && pass.checkedInAt ? (
        <p className="mt-3 text-xs text-emerald-300/90">
          Checked in at {pass.checkedInAt.toLocaleTimeString()}
        </p>
      ) : null}
    </section>
  )
}

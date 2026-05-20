import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { getMeetupShareUrl } from '../utils/meetupShare'

type Props = {
  meetupId: string
  title?: string
}

export function MeetupShareCard({ meetupId, title }: Props) {
  const shareUrl = useMemo(() => getMeetupShareUrl(meetupId), [meetupId])
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!showQr) {
      return
    }
    let cancelled = false
    setQrError(null)
    void QRCode.toDataURL(shareUrl, {
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
  }, [shareUrl, showQr])

  async function copyLink() {
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopyError('Copy failed — select the link below and copy manually.')
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: title ? `${title} · MeetToTalk` : 'MeetToTalk meetup',
        text: title ?? 'Join this meetup on MeetToTalk',
        url: shareUrl,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
    }
  }

  return (
    <section className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden>🔗</span>
        <h2 className="font-display text-base font-semibold text-slate-100">
          Share meetup
        </h2>
      </div>

      <p className="mt-3 break-all rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 font-mono text-xs text-slate-300">
        {shareUrl}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-surface-950"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="inline-flex items-center gap-1 rounded-xl bg-surface-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-surface-700"
        >
          {showQr ? 'Hide QR' : 'Show QR'}
        </button>
        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void nativeShare()}
            className="inline-flex items-center gap-1 rounded-xl bg-surface-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-surface-700"
          >
            Share…
          </button>
        ) : null}
      </div>

      {showQr ? (
        <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR code to open this meetup"
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

      {copyError ? (
        <p className="mt-2 text-xs text-red-300">{copyError}</p>
      ) : null}
      {!import.meta.env.VITE_APP_URL ? (
        <p className="mt-2 text-xs text-muted">
          For phone QR scans on the same Wi-Fi, set{' '}
          <code className="text-brand">VITE_APP_URL</code> in your{' '}
          <code className="text-brand">.env</code> to your laptop’s LAN URL.
        </p>
      ) : null}
    </section>
  )
}

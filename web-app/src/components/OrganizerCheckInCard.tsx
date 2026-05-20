import { useEffect, useMemo, useRef, useState } from 'react'
import {
  checkInByCode,
  checkInParticipant,
  subscribeAllPasses,
} from '../services/meetups'
import type { ParticipantPass } from '../types/models'

type Props = {
  meetupId: string
  organizerUid: string
}

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}

type BarcodeDetectorCtor = new (opts?: {
  formats?: string[]
}) => BarcodeDetectorLike

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined') {
    return null
  }
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
  return w.BarcodeDetector ?? null
}

export function OrganizerCheckInCard({ meetupId, organizerUid }: Props) {
  const [passes, setPasses] = useState<ParticipantPass[]>([])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'success'; text: string }
    | { kind: 'error'; text: string }
  >({ kind: 'idle' })
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoopRef = useRef<number | null>(null)

  const DetectorCtor = useMemo(() => getBarcodeDetector(), [])
  const canScanCamera =
    !!DetectorCtor &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia

  useEffect(() => {
    const unsub = subscribeAllPasses(meetupId, setPasses, (e) =>
      setStatus({ kind: 'error', text: e.message }),
    )
    return () => unsub()
  }, [meetupId])

  function stopScanner() {
    if (scanLoopRef.current != null) {
      window.clearInterval(scanLoopRef.current)
      scanLoopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => stopScanner()
  }, [])

  async function startScanner() {
    if (!DetectorCtor) {
      setScanError(
        'Camera scanning is not supported in this browser. Enter the code manually.',
      )
      return
    }
    if (!window.isSecureContext) {
      setScanError(
        'Camera requires HTTPS or localhost. Use manual entry on a LAN URL.',
      )
      return
    }
    setScanError(null)
    setStatus({ kind: 'idle' })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setScanning(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const detector = new DetectorCtor({ formats: ['qr_code'] })
      scanLoopRef.current = window.setInterval(async () => {
        const v = videoRef.current
        if (!v || v.readyState < 2) {
          return
        }
        try {
          const found = await detector.detect(v)
          if (found && found.length > 0) {
            const raw = found[0].rawValue
            if (raw) {
              stopScanner()
              setCode(raw)
              await runCheckIn(raw)
            }
          }
        } catch {
          // ignore per-frame errors
        }
      }, 400)
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'Could not start camera. Use manual entry.',
      )
      stopScanner()
    }
  }

  async function runCheckIn(rawCode: string) {
    setBusy(true)
    setStatus({ kind: 'idle' })
    try {
      const pass = await checkInByCode(meetupId, rawCode, organizerUid)
      setStatus({
        kind: 'success',
        text: pass.checkedIn
          ? `Checked in ${pass.code}`
          : `Found ${pass.code}, but already checked in.`,
      })
      setCode('')
    } catch (e) {
      setStatus({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Check-in failed.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function manualCheckIn(e: React.FormEvent) {
    e.preventDefault()
    await runCheckIn(code)
  }

  const checkedInCount = passes.filter((p) => p.checkedIn).length

  return (
    <section className="rounded-2xl border border-surface-700 bg-surface-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-slate-100">Organizer check-in</h2>
        <span className="text-xs text-muted">
          {checkedInCount} / {passes.length} checked in
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Scan or enter a participant code to confirm attendance.
      </p>

      <form onSubmit={(e) => void manualCheckIn(e)} className="mt-4 space-y-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Participant code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MTT-XXXX-XXXX"
            className="mt-1 w-full rounded-xl border border-surface-700 bg-surface-900 px-3 py-2.5 font-mono text-slate-100 outline-none ring-brand/30 focus:ring-2"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950 disabled:opacity-50"
          >
            {busy ? 'Checking in…' : 'Check in'}
          </button>
          {canScanCamera ? (
            scanning ? (
              <button
                type="button"
                onClick={stopScanner}
                className="inline-flex rounded-xl bg-surface-800 px-4 py-2 text-sm font-medium text-brand hover:bg-surface-700"
              >
                Stop scanner
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startScanner()}
                className="inline-flex rounded-xl bg-surface-800 px-4 py-2 text-sm font-medium text-brand hover:bg-surface-700"
              >
                Scan QR
              </button>
            )
          ) : null}
        </div>
      </form>

      {scanning ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-surface-700 bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-56 w-full object-cover"
          />
        </div>
      ) : null}

      {scanError ? (
        <p className="mt-2 text-xs text-amber-300/90">{scanError}</p>
      ) : null}
      {status.kind === 'success' ? (
        <p className="mt-2 rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-2 text-sm text-emerald-300">
          {status.text}
        </p>
      ) : null}
      {status.kind === 'error' ? (
        <p className="mt-2 rounded-lg border border-red-900/50 bg-red-950/30 p-2 text-sm text-red-300">
          {status.text}
        </p>
      ) : null}

      <ul className="mt-4 divide-y divide-surface-700/70 text-sm">
        {passes.length === 0 ? (
          <li className="py-3 text-xs text-muted">No participants yet.</li>
        ) : (
          passes.map((p) => (
            <li
              key={p.userId}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-slate-200">
                  {p.code}
                </p>
                <p className="truncate text-xs text-muted">
                  {p.userId.slice(0, 6)}… · joined{' '}
                  {p.joinedAt.toLocaleTimeString()}
                </p>
              </div>
              {p.checkedIn ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  Checked in
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void checkInParticipant(meetupId, p.userId, organizerUid)
                      .then(() =>
                        setStatus({
                          kind: 'success',
                          text: `Checked in ${p.code}`,
                        }),
                      )
                      .catch((e: unknown) =>
                        setStatus({
                          kind: 'error',
                          text:
                            e instanceof Error
                              ? e.message
                              : 'Check-in failed.',
                        }),
                      )
                  }
                  className="rounded-lg border border-surface-600 px-2 py-1 text-xs text-slate-200 hover:bg-surface-700"
                >
                  Check in
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

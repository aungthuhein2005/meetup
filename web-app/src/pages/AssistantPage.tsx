import { useEffect, useMemo, useState } from 'react'
import { isGeminiConfigured, assistantReply } from '../services/gemini'
import { subscribeActiveMeetups } from '../services/meetups'
import type { Meetup } from '../types/models'
import { haversineKm } from '../utils/geo'
import { useAuth } from '../context/AuthContext'

type Msg = { role: 'user' | 'model'; text: string }

export function AssistantPage() {
  const { profile } = useAuth()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const unsub = subscribeActiveMeetups(setMeetups)
      return () => unsub()
    } catch {
      return () => {}
    }
  }, [])

  const nearbySummary = useMemo(() => {
    const center = profile?.location
    const r = profile?.radiusKm ?? 10
    const list = center
      ? meetups
          .map((m) => ({
            m,
            d: haversineKm(center, { lat: m.place.lat, lng: m.place.lng }),
          }))
          .filter((x) => x.d <= r)
          .sort((a, b) => a.d - b.d)
          .slice(0, 12)
          .map((x) => x.m)
      : meetups.slice(0, 12)
    if (!list.length) {
      return 'No upcoming meetups loaded yet.'
    }
    return list
      .map(
        (m) =>
          `- ${m.title} (${m.tags.join(', ') || 'untagged'}) — starts ${m.time.start.toISOString()}`,
      )
      .join('\n')
  }, [meetups, profile?.location, profile?.radiusKm])

  async function send() {
    const text = input.trim()
    if (!text) {
      return
    }
    if (!isGeminiConfigured()) {
      setError('Add VITE_GEMINI_API_KEY to use the assistant.')
      return
    }
    const nextHistory = [...messages, { role: 'user' as const, text }]
    setMessages(nextHistory)
    setInput('')
    setBusy(true)
    setError(null)
    try {
      const reply = await assistantReply({
        history: nextHistory,
        nearbyMeetupsSummary: nearbySummary,
      })
      setMessages((h) => [...h, { role: 'model', text: reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assistant failed.')
      setMessages((h) => h.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-6 pb-24" style={{ minHeight: '70vh' }}>
      <h1 className="font-display text-2xl font-semibold text-slate-100">
        MeetToTalk assistant
      </h1>
      <p className="mt-1 text-sm text-muted">
        Ask about nearby events, logistics, or what to host next.
      </p>

      {!isGeminiConfigured() ? (
        <p className="mt-4 rounded-xl border border-surface-700 bg-surface-800/40 p-3 text-sm text-muted">
          Configure <code className="text-brand">VITE_GEMINI_API_KEY</code> to enable the Gemini
          assistant.
        </p>
      ) : null}

      <div className="mt-6 flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-surface-700 bg-surface-900/50">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted">
              Try: &ldquo;What should I join this evening near me?&rdquo;
            </p>
          ) : null}
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-brand-dim text-slate-100'
                  : 'mr-auto bg-surface-800 text-slate-200'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        {error ? (
          <p className="px-4 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <form
          className="flex gap-2 border-t border-surface-700 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-xl border border-surface-700 bg-surface-950 px-3 py-2 text-sm text-slate-100 outline-none ring-brand/30 focus:ring-2"
            placeholder="Ask about meetups…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950 disabled:opacity-50"
          >
            {busy ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

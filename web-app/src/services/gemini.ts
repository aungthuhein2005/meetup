import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Meetup } from '../types/models'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const modelId =
  import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash'

export function isGeminiConfigured(): boolean {
  return Boolean(apiKey)
}

function getModel() {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.')
  }
  const gen = new GoogleGenerativeAI(apiKey)
  return gen.getGenerativeModel({ model: modelId })
}

export async function rankMeetupsWithGemini(input: {
  userInterests: string[]
  userLocationLabel: string
  meetups: Pick<Meetup, 'id' | 'title' | 'tags' | 'description'>[]
}): Promise<string[]> {
  if (!input.meetups.length) {
    return []
  }
  const model = getModel()
  const payload = JSON.stringify(
    input.meetups.map((m) => ({
      id: m.id,
      title: m.title,
      tags: m.tags,
      description: m.description.slice(0, 400),
    })),
  )
  const prompt = `You help rank in-person meetups for a user.

User interests (tags): ${input.userInterests.join(', ') || 'general social'}
User context: ${input.userLocationLabel}

Meetups JSON array:
${payload}

Return ONLY a JSON array of meetup "id" strings, best match first. No markdown, no explanation. Max 8 ids. If none fit, return [].`

  const res = await model.generateContent(prompt)
  const text = res.response.text().trim()
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try {
    const parsed = JSON.parse(cleaned) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export async function assistantReply(input: {
  history: { role: 'user' | 'model'; text: string }[]
  nearbyMeetupsSummary: string
}): Promise<string> {
  const model = getModel()
  const transcript = input.history
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
    .join('\n')

  const prompt = `You are MeetToTalk, a concise assistant for discovering and attending real-world meetups.

Nearby meetups (may be empty):
${input.nearbyMeetupsSummary}

Conversation:
${transcript}

Reply as the assistant to the latest user message. Be brief, actionable, and mention specific meetup titles when helpful.`

  const res = await model.generateContent(prompt)
  return res.response.text().trim()
}

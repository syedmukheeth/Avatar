import { z } from "zod"

import { aiEnabled, synthesize } from "@/lib/ai/gemini"
import { checkLimit, clientKey, SPEECH_LIMIT } from "@/lib/ai/rate-limit"
import { getDemoCharacter } from "@/lib/demo/characters"

export const runtime = "nodejs"
export const maxDuration = 60

const Body = z.object({
  slug: z.string().min(1).max(64),
  text: z.string().min(1).max(600),
})

export async function POST(request: Request) {
  if (!aiEnabled()) return Response.json({ error: "unavailable" }, { status: 503 })

  const limit = checkLimit(clientKey(request), "speech", SPEECH_LIMIT)
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    )
  }

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 })

  const character = getDemoCharacter(parsed.data.slug)
  if (!character) return Response.json({ error: "not_found" }, { status: 404 })

  try {
    const wav = await synthesize({
      text: parsed.data.text,
      voiceName: character.speech.voice,
      style: character.speech.style,
      signal: request.signal,
    })
    return new Response(new Uint8Array(wav), {
      headers: {
        "content-type": "audio/wav",
        "content-length": String(wav.length),
        "cache-control": "no-store",
      },
    })
  } catch (error) {
    console.error("speech failed:", error instanceof Error ? error.message : "unknown")
    return Response.json({ error: "speech_failed" }, { status: 502 })
  }
}

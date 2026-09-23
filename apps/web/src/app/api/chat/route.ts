import { z } from "zod"

import { aiEnabled, streamAnswer } from "@/lib/ai/gemini"
import { buildSystemPrompt, parseAnswer, trailerIndex } from "@/lib/ai/prompt"
import { CHAT_LIMIT, checkLimit, clientKey } from "@/lib/ai/rate-limit"
import { getDemoCharacter } from "@/lib/demo/characters"

export const runtime = "nodejs"
export const maxDuration = 60

const Body = z.object({
  slug: z.string().min(1).max(64),
  mode: z.enum(["text", "voice"]).default("text"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1).max(1000),
      }),
    )
    .min(1)
    .max(16),
})

function event(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  if (!aiEnabled()) {
    return Response.json({ error: "unavailable" }, { status: 503 })
  }

  const limit = checkLimit(clientKey(request), "chat", CHAT_LIMIT)
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

  const system = buildSystemPrompt(character, parsed.data.mode)
  const history = parsed.data.messages.map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    text: message.text,
  }))

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (data: unknown) => controller.enqueue(encoder.encode(event(data)))
      let full = ""
      let emitted = 0

      try {
        for await (const chunk of streamAnswer({
          system,
          history,
          maxOutputTokens: parsed.data.mode === "voice" ? 260 : 900,
          signal: request.signal,
        })) {
          full += chunk
          // Hold back the tail so the machine-readable trailer is never shown.
          const marker = trailerIndex(full)
          const visible =
            marker >= 0 ? full.slice(0, marker) : full.slice(0, Math.max(0, full.length - 10))
          if (visible.length > emitted) {
            send({ type: "delta", text: visible.slice(emitted) })
            emitted = visible.length
          }
          if (marker >= 0) break
        }

        const { answer, sources, basis } = parseAnswer(full)
        send({ type: "final", answer, sources, basis })
      } catch (error) {
        console.error("chat failed:", error instanceof Error ? error.message : "unknown")
        send({ type: "error" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      connection: "keep-alive",
    },
  })
}

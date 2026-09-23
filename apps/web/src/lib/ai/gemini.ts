import "server-only"

// Server-side Gemini access. The API key never reaches the browser: every call goes through
// the route handlers in src/app/api.

const API = "https://generativelanguage.googleapis.com/v1beta/models"

// Tried in order: when the first model is overloaded or out of quota, the next one answers.
export const CHAT_MODELS = ["gemini-3.5-flash", "gemini-2.5-flash"]
export const TTS_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"]

/** True when the server can answer with a real model. */
export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY is not set")
  return key
}

type Turn = { role: "user" | "model"; text: string }

const RETRY_STATUS = new Set([429, 500, 502, 503, 504])

/**
 * Posts to each model in turn. Gemini answers 503 when a model is briefly overloaded and 429
 * when the key is out of quota; both are worth retrying once, then trying the next model.
 */
async function postWithRetry(
  models: string[],
  path: (model: string) => string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  let lastStatus = 0
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(`${API}/${path(model)}`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey() },
        body: JSON.stringify(body),
      })
      if (response.ok) return response
      lastStatus = response.status
      if (!RETRY_STATUS.has(response.status)) {
        throw new Error(`gemini request failed: ${lastStatus}`)
      }
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }
  throw new Error(`gemini request failed: ${lastStatus}`)
}

/**
 * Streams a grounded answer. Thinking is switched off: this model otherwise spends the whole
 * output budget on hidden reasoning and truncates the reply.
 */
export async function* streamAnswer(options: {
  system: string
  history: Turn[]
  maxOutputTokens: number
  signal?: AbortSignal
}): AsyncGenerator<string> {
  const response = await postWithRetry(
    CHAT_MODELS,
    (model) => `${model}:streamGenerateContent?alt=sse`,
    {
      systemInstruction: { parts: [{ text: options.system }] },
      contents: options.history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: options.maxOutputTokens,
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    options.signal,
  )

  if (!response.ok || !response.body) {
    throw new Error(`gemini chat failed: ${response.status}`)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data:")) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === "[DONE]") continue
      try {
        const chunk = JSON.parse(payload) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        }
        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          if (part.text) yield part.text
        }
      } catch {
        // Ignore partial or keep-alive frames.
      }
    }
  }
}

function wavHeader(dataBytes: number, sampleRate: number, channels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44)
  const byteRate = (sampleRate * channels * bitsPerSample) / 8
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + dataBytes, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write("data", 36)
  header.writeUInt32LE(dataBytes, 40)
  return header
}

/** Reads the sample rate out of a mime type such as `audio/l16; rate=24000`. */
export function sampleRateOf(mimeType: string, fallback = 24000): number {
  const match = /rate=(\d+)/i.exec(mimeType)
  return match ? Number(match[1]) : fallback
}

/** Speaks text in one of Gemini's prebuilt voices and returns a playable WAV. */
export async function synthesize(options: {
  text: string
  voiceName: string
  /** Delivery note, e.g. "Warm and encouraging, unhurried." */
  style: string
  signal?: AbortSignal
}): Promise<Buffer> {
  const response = await postWithRetry(
    TTS_MODELS,
    (model) => `${model}:generateContent`,
    {
      contents: [{ parts: [{ text: `${options.style}\n\n${options.text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voiceName } },
        },
      },
    },
    options.signal,
  )

  const body = (await response.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[]
  }
  const audio = body.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData
  if (!audio) throw new Error("gemini tts returned no audio")

  const pcm = Buffer.from(audio.data, "base64")
  return Buffer.concat([wavHeader(pcm.length, sampleRateOf(audio.mimeType)), pcm])
}

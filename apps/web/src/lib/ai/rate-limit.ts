import "server-only"

// Guardrails for a public site backed by one API key. Counters live in the server instance's
// memory, so limits are per instance and reset on redeploy: enough to stop casual abuse and
// runaway cost, not a substitute for a shared store once there is real traffic.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let dayStamp = new Date().toISOString().slice(0, 10)
let dayTotal = 0

const DAILY_MODEL_CALLS = 1500

export type Limit = { windowMs: number; max: number }

export const CHAT_LIMIT: Limit = { windowMs: 10 * 60_000, max: 25 }
export const SPEECH_LIMIT: Limit = { windowMs: 10 * 60_000, max: 50 }

function prune(now: number) {
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key)
}

/** Client IP as seen through Vercel's proxy. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || "unknown"
}

export function checkLimit(
  key: string,
  name: string,
  limit: Limit,
): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  prune(now)

  const today = new Date().toISOString().slice(0, 10)
  if (today !== dayStamp) {
    dayStamp = today
    dayTotal = 0
  }
  if (dayTotal >= DAILY_MODEL_CALLS) return { ok: false, retryAfter: 3600 }

  const id = `${name}:${key}`
  const bucket = buckets.get(id)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + limit.windowMs })
    dayTotal += 1
    return { ok: true, retryAfter: 0 }
  }
  if (bucket.count >= limit.max) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count += 1
  dayTotal += 1
  return { ok: true, retryAfter: 0 }
}

/** Visible for tests. */
export function resetLimits() {
  buckets.clear()
  dayTotal = 0
}

import { z } from "zod"

// Every value here ships to the browser. Never add a secret.
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  // The backend runs on its own host (Render in production). Stored without a trailing slash.
  NEXT_PUBLIC_API_URL: z
    .url()
    .transform((value) => value.replace(/\/+$/, ""))
    .optional(),
  NEXT_PUBLIC_VOICE_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
})

// Referenced one by one so Next.js can inline them into client bundles. Empty strings count as
// unset, which is how dashboards usually store a blank value.
export const env = schema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || undefined,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  NEXT_PUBLIC_VOICE_ENABLED: process.env.NEXT_PUBLIC_VOICE_ENABLED || undefined,
})

const hasSupabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL !== undefined
const hasSupabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== undefined
if (hasSupabaseUrl !== hasSupabaseKey) {
  // Half a configuration is a mistake, not a demo: fail the build loudly.
  throw new Error(
    "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or neither for demo mode.",
  )
}

/**
 * Without Supabase the app runs as a self-contained demo: sample creators, a browser-side
 * grounded answer engine and browser voice. Nothing leaves the visitor's browser.
 */
export const demoMode = !hasSupabaseUrl

export function supabaseConfig(): { url: string; key: string } {
  if (demoMode || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase is not configured (demo mode)")
  }
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }
}

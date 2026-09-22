import { z } from "zod"

// Absolute URL (local dev on another port) or same-origin path (Vercel Services routes
// /api/backend/* to the Python backend). Stored without a trailing slash.
export const apiBaseSchema = z
  .string()
  .refine((value) => value.startsWith("/") || URL.canParse(value), "Must be a URL or /path")
  .transform((value) => value.replace(/\/+$/, ""))

// Every value here ships to the browser. Never add a secret.
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_API_URL: apiBaseSchema.default("/api/backend"),
  NEXT_PUBLIC_VOICE_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
})

// Referenced one by one so Next.js can inline them into client bundles.
export const env = schema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  NEXT_PUBLIC_VOICE_ENABLED: process.env.NEXT_PUBLIC_VOICE_ENABLED || undefined,
})

import "server-only"

import { env } from "@/lib/env"

/** Canonical origin for metadata: explicit setting, then Vercel's production domain. */
export function siteUrl(): URL {
  if (env.NEXT_PUBLIC_SITE_URL) return new URL(env.NEXT_PUBLIC_SITE_URL)
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelDomain) return new URL(`https://${vercelDomain}`)
  return new URL("http://localhost:3000")
}

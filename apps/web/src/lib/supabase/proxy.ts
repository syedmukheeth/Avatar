import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { demoMode, supabaseConfig } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Refreshes the auth session on every matched request and writes rotated tokens back to the
 * browser. Authorization happens in layouts and the API, not here.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (demoMode) return response

  const { url, key } = supabaseConfig()
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        // Responses that set auth cookies must never be cached.
        Object.entries(headers).forEach(([header, value]) => response.headers.set(header, value))
      },
    },
  })

  // Validates the JWT (and refreshes it when expired). Do not remove.
  await supabase.auth.getClaims()

  return response
}

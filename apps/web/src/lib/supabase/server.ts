import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { supabaseConfig } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

/** A new client per request; never share one across requests. */
export async function createClient() {
  const { url, key } = supabaseConfig()
  const cookieStore = await cookies()
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot write cookies; the proxy refreshes the session instead.
        }
      },
    },
  })
}

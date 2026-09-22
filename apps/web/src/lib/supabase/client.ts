import { createBrowserClient } from "@supabase/ssr"

import { supabaseConfig } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

export function createClient() {
  const { url, key } = supabaseConfig()
  return createBrowserClient<Database>(url, key)
}

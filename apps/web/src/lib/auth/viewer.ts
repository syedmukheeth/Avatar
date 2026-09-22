import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"

import type { ViewerRole } from "@/lib/auth/destination"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export type Viewer = ViewerRole & {
  userId: string
  email: string | null
}

export async function loadViewerRole(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ViewerRole> {
  const [profile, creator] = await Promise.all([
    supabase.from("profiles").select("account_type").eq("id", userId).maybeSingle(),
    supabase.from("creators").select("id").eq("user_id", userId).maybeSingle(),
  ])
  if (profile.error) throw profile.error
  if (creator.error) throw creator.error
  return {
    accountType: profile.data?.account_type ?? null,
    creatorId: creator.data?.id ?? null,
  }
}

/** The signed-in user for this request, verified from the JWT. Memoised per render. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  const role = await loadViewerRole(supabase, claims.sub)
  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    ...role,
  }
})

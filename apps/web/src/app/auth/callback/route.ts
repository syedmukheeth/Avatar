import { NextResponse, type NextRequest } from "next/server"

import { afterSignIn, safeNextPath } from "@/lib/auth/destination"
import { loadViewerRole } from "@/lib/auth/viewer"
import { createClient } from "@/lib/supabase/server"

// Magic links and Google OAuth both land here with a PKCE code.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const role = await loadViewerRole(supabase, data.user.id)
      return NextResponse.redirect(new URL(afterSignIn(role, next), origin))
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", origin))
}

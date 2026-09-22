import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

import { DEMO_ROLE_COOKIE } from "@/lib/demo/session"
import { demoMode } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  if (demoMode) {
    ;(await cookies()).delete(DEMO_ROLE_COOKIE)
  } else {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 })
}

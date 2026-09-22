"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { safeNextPath } from "@/lib/auth/destination"
import { DEMO_ROLE_COOKIE, isDemoRole } from "@/lib/demo/session"
import { demoMode } from "@/lib/env"

export async function enterDemo(formData: FormData) {
  if (!demoMode) throw new Error("Demo sign-in is only available in demo mode")
  const role = formData.get("role")
  if (!isDemoRole(role)) throw new Error("Invalid demo role")

  ;(await cookies()).set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  const next = safeNextPath(formData.get("next")?.toString())
  redirect(next ?? (role === "creator" ? "/studio" : "/explore"))
}

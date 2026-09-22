import "server-only"

import { cookies } from "next/headers"

import type { AccountType } from "@/lib/auth/destination"
import type { Viewer } from "@/lib/auth/viewer"

export const DEMO_ROLE_COOKIE = "ml_demo_role"

/** The creator a demo visitor becomes when they choose "Explore as a creator". */
export const DEMO_CREATOR = {
  userId: "demo-creator",
  creatorId: "demo-creator-maya",
  displayName: "Maya Rao",
  profession: "Strength & mobility coach",
  bio: "I help busy people get strong with three sessions a week. 2,000+ clients coached since 2016.",
} as const

export async function getDemoViewer(): Promise<Viewer | null> {
  const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value
  if (role === "creator") {
    return {
      userId: DEMO_CREATOR.userId,
      email: null,
      accountType: "creator",
      creatorId: DEMO_CREATOR.creatorId,
    }
  }
  if (role === "user") {
    return { userId: "demo-audience", email: null, accountType: "user", creatorId: null }
  }
  return null
}

export function isDemoRole(value: unknown): value is AccountType {
  return value === "creator" || value === "user"
}

export type AccountType = "creator" | "user"

export type ViewerRole = {
  accountType: AccountType | null
  creatorId: string | null
}

/** Where a signed-in user belongs when no explicit destination was requested. */
export function homeFor({ accountType, creatorId }: ViewerRole): string {
  if (accountType === null) return "/welcome"
  if (accountType === "creator") return creatorId ? "/studio" : "/studio/profile"
  return "/explore"
}

const CONTROL_CHARS = /[\x00-\x1f\x7f]/

/**
 * Accepts only same-site relative paths, so `?next=` can never become an open redirect.
 * Rejects protocol-relative (`//evil.com`) and backslash (`/\evil.com`) tricks.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null
  if (CONTROL_CHARS.test(raw)) return null
  return raw
}

/** Destination after sign-in: role choice always comes first, then `next`, then home. */
export function afterSignIn(role: ViewerRole, next: string | null): string {
  if (role.accountType === null) {
    return next ? `/welcome?next=${encodeURIComponent(next)}` : "/welcome"
  }
  return next ?? homeFor(role)
}

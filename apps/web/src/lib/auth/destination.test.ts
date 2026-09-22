import { describe, expect, it } from "vitest"

import { afterSignIn, homeFor, safeNextPath } from "@/lib/auth/destination"

describe("safeNextPath", () => {
  it.each(["/studio", "/c/jane-doe/chat?x=1", "/welcome?next=%2Fstudio"])("keeps %s", (path) => {
    expect(safeNextPath(path)).toBe(path)
  })

  it.each([
    "https://evil.example",
    "//evil.example",
    String.raw`/\evil.example`,
    "javascript:alert(1)",
    "studio",
    "/studio\nSet-Cookie: x",
    "",
    null,
    undefined,
    `/${"a".repeat(600)}`,
  ])("rejects %s", (path) => {
    expect(safeNextPath(path)).toBeNull()
  })
})

describe("homeFor", () => {
  it("routes by role", () => {
    expect(homeFor({ accountType: null, creatorId: null })).toBe("/welcome")
    expect(homeFor({ accountType: "user", creatorId: null })).toBe("/explore")
    expect(homeFor({ accountType: "creator", creatorId: null })).toBe("/studio/profile")
    expect(homeFor({ accountType: "creator", creatorId: "c1" })).toBe("/studio")
  })
})

describe("afterSignIn", () => {
  it("always asks for a role first and carries next along", () => {
    expect(afterSignIn({ accountType: null, creatorId: null }, "/c/x/chat")).toBe(
      "/welcome?next=%2Fc%2Fx%2Fchat",
    )
  })

  it("honours next once a role exists", () => {
    expect(afterSignIn({ accountType: "user", creatorId: null }, "/c/x/chat")).toBe("/c/x/chat")
    expect(afterSignIn({ accountType: "user", creatorId: null }, null)).toBe("/explore")
  })
})

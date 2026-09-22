import { beforeAll, describe, expect, it, vi } from "vitest"

let apiBaseSchema: typeof import("@/lib/env").apiBaseSchema

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test")
  ;({ apiBaseSchema } = await import("@/lib/env"))
})

describe("apiBaseSchema", () => {
  it("accepts a same-origin path and strips trailing slashes", () => {
    expect(apiBaseSchema.parse("/api/backend/")).toBe("/api/backend")
  })

  it("accepts an absolute URL for local development", () => {
    expect(apiBaseSchema.parse("http://localhost:8000/api/backend")).toBe(
      "http://localhost:8000/api/backend",
    )
  })

  it("rejects relative paths without a leading slash", () => {
    expect(apiBaseSchema.safeParse("api/backend").success).toBe(false)
  })
})

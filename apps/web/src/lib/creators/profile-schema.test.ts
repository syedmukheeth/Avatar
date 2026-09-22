import { describe, expect, it } from "vitest"

import { creatorProfileSchema, toSocialLinks } from "@/lib/creators/profile-schema"

const base = {
  displayName: "Jane Doe",
  profession: "",
  bio: "",
  social: { website: "", instagram: "", youtube: "", linkedin: "", x: "" },
}

describe("creatorProfileSchema", () => {
  it("accepts a minimal profile", () => {
    expect(creatorProfileSchema.safeParse(base).success).toBe(true)
  })

  it("requires a display name and https links", () => {
    const result = creatorProfileSchema.safeParse({
      ...base,
      displayName: "  ",
      social: { ...base.social, website: "http://jane.dev" },
    })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((issue) => issue.path.join("."))
    expect(paths).toEqual(expect.arrayContaining(["displayName", "social.website"]))
  })

  it("drops empty links", () => {
    expect(toSocialLinks({ ...base.social, x: "https://x.com/jane" })).toEqual({
      x: "https://x.com/jane",
    })
  })
})

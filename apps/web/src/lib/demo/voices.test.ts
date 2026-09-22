import { describe, expect, it } from "vitest"

import { pickVoice } from "@/lib/demo/voices"

const voices = [
  { name: "Microsoft David - English (United States)", lang: "en-US" },
  { name: "Microsoft Zira - English (United States)", lang: "en-US" },
  { name: "Microsoft Heera - English (India)", lang: "en-IN" },
  { name: "Microsoft Ravi - English (India)", lang: "en-IN" },
  { name: "Google UK English Female", lang: "en-GB" },
  { name: "Google español", lang: "es-ES" },
]

describe("pickVoice", () => {
  it("matches accent and gender", () => {
    expect(
      pickVoice(voices, { lang: "en-IN", gender: "female", pitch: 1, rate: 1 })?.name,
    ).toContain("Heera")
    expect(pickVoice(voices, { lang: "en-IN", gender: "male", pitch: 1, rate: 1 })?.name).toContain(
      "Ravi",
    )
    expect(pickVoice(voices, { lang: "en-GB", gender: "female", pitch: 1, rate: 1 })?.name).toBe(
      "Google UK English Female",
    )
  })

  it("does not mistake female voices for male ones", () => {
    const onlyFemale = [{ name: "Google UK English Female", lang: "en-GB" }]
    const male = pickVoice(onlyFemale, { lang: "en-GB", gender: "male", pitch: 1, rate: 1 })
    expect(male?.name).toBe("Google UK English Female") // best available, not a crash
  })

  it("never picks a non-English voice for English answers", () => {
    expect(
      pickVoice([{ name: "Google español", lang: "es-ES" }], {
        lang: "en-US",
        gender: "female",
        pitch: 1,
        rate: 1,
      }),
    ).toBeNull()
  })
})

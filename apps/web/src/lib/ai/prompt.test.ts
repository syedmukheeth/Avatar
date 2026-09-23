import { describe, expect, it } from "vitest"

import { buildSystemPrompt, parseAnswer, trailerIndex } from "@/lib/ai/prompt"
import { getDemoCharacter } from "@/lib/demo/characters"

const maya = getDemoCharacter("coach-maya")!

describe("buildSystemPrompt", () => {
  it("puts the creator material first but allows general expertise", () => {
    const prompt = buildSystemPrompt(maya, "text")
    expect(prompt).toContain("AI representation of Maya Rao")
    expect(prompt).toContain("<approved_knowledge>")
    expect(prompt).toContain("Eat for Strength guide.pdf")
    expect(prompt).toContain("general guidance")
  })

  it("keeps the guardrails that protect the creator", () => {
    const prompt = buildSystemPrompt(maya, "voice")
    expect(prompt).toContain("Invent facts about Maya Rao")
    expect(prompt).toContain("information only")
    expect(prompt).toContain("Claim to be human")
    expect(prompt).toContain("under 60 words")
  })
})

describe("parseAnswer", () => {
  it("reads sources and basis from the trailer", () => {
    const raw = [
      "Aim for 1.6 grams per kilo.",
      "SOURCES: Eat for Strength guide.pdf | Recovery notes.txt",
      "BASIS: knowledge",
    ].join("\n")
    const parsed = parseAnswer(raw)
    expect(parsed.answer).toBe("Aim for 1.6 grams per kilo.")
    expect(parsed.sources).toEqual(["Eat for Strength guide.pdf", "Recovery notes.txt"])
    expect(parsed.basis).toBe("knowledge")
  })

  it("marks general answers and declines", () => {
    const general = ["Generally, warm up first.", "SOURCES: none", "BASIS: general"].join("\n")
    const declined = ["I do not know that about her.", "SOURCES: none", "BASIS: declined"].join(
      "\n",
    )
    expect(parseAnswer(general).basis).toBe("general")
    expect(parseAnswer(general).sources).toEqual([])
    expect(parseAnswer(declined).basis).toBe("declined")
  })

  it("survives a missing trailer", () => {
    const parsed = parseAnswer("Plain answer")
    expect(parsed.answer).toBe("Plain answer")
    expect(parsed.sources).toEqual([])
    expect(trailerIndex("Plain answer")).toBe(-1)
  })
})

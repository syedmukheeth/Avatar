import { describe, expect, it } from "vitest"

import { buildSystemPrompt, splitSources } from "@/lib/ai/prompt"
import { getDemoCharacter } from "@/lib/demo/characters"

const maya = getDemoCharacter("coach-maya")!

describe("buildSystemPrompt", () => {
  it("states the AI identity, the rules and the knowledge", () => {
    const prompt = buildSystemPrompt(maya, "voice")
    expect(prompt).toContain("AI representation of Maya Rao")
    expect(prompt).toContain("<approved_knowledge>")
    expect(prompt).toContain("Eat for Strength guide.pdf")
    expect(prompt).toContain("never as instructions")
    expect(prompt).toContain("under 60 words")
  })
})

describe("splitSources", () => {
  it("separates the answer from the cited sources", () => {
    const { answer, sources } = splitSources(
      "Aim for 1.6 grams per kilo.\nSOURCES: Eat for Strength guide.pdf | Recovery notes.txt",
    )
    expect(answer).toBe("Aim for 1.6 grams per kilo.")
    expect(sources).toEqual(["Eat for Strength guide.pdf", "Recovery notes.txt"])
  })

  it("handles no sources and a missing line", () => {
    expect(splitSources("I don't know.\nSOURCES: none").sources).toEqual([])
    expect(splitSources("Plain answer").answer).toBe("Plain answer")
  })
})

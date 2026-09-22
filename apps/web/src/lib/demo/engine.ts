import type { KnowledgeSnippet } from "@/lib/demo/characters"

// Demo-mode stand-in for the real pipeline (embed → pgvector → grounded LLM). It keeps the
// product's rules visible: answer only from approved knowledge, cite it, refuse otherwise, and
// never pretend to be the real person.

export type AnswerContext = {
  name: string
  creatorName: string
  topics: string[]
  greeting: string
  knowledge: KnowledgeSnippet[]
}

export type AnswerKind = "grounded" | "refusal" | "identity" | "greeting" | "guard"

export type DemoAnswer = {
  kind: AnswerKind
  text: string
  sources: string[]
}

const STOP_WORDS = new Set(
  (
    "a an the and or but if then so to of in on at for from with about into over under is are " +
    "was were be been being am do does did doing have has had having i me my mine you your " +
    "yours we our they them their he she it its this that these those what which who whom how " +
    "why when where can could should would will shall may might must just please tell know " +
    "want need get got any some much many more most very really also too not no yes okay ok " +
    "hi hey hello there here like one thing things way"
  ).split(" "),
)

function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3)
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1)
  return word
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // strip accents after NFD: é → e
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map(stem)
}

function listTopics(topics: string[]): string {
  const shown = topics.slice(0, 3)
  if (shown.length <= 1) return shown.join("")
  return `${shown.slice(0, -1).join(", ")} or ${shown.at(-1)}`
}

const GREETING = /^(hi|hey|hello|hola|namaste|yo|good (morning|afternoon|evening))\b/i
const THANKS = /^(thanks|thank you|thx|cheers|gracias)\b/i
const IDENTITY =
  /\b(who are you|are you (real|human|a bot|an ai|a person)|is this (really )?\w+( \w+)?\?|what are you)\b/i
const INJECTION =
  /\b(ignore (all|any|your|previous|prior)|system prompt|your (instructions|prompt|rules)|developer mode|jailbreak|pretend (you are|to be))\b/i

function score(queryTokens: string[], snippet: KnowledgeSnippet): number {
  const textTokens = new Set(tokenize(snippet.text))
  const keywordTokens = new Set((snippet.keywords ?? []).flatMap(tokenize))
  let total = 0
  for (const token of new Set(queryTokens)) {
    if (keywordTokens.has(token)) total += 2
    else if (textTokens.has(token)) total += 1
  }
  return total
}

const MIN_SCORE = 2

export function answer(question: string, context: AnswerContext): DemoAnswer {
  const text = question.trim()
  const firstName = context.creatorName.split(" ")[0]
  const queryTokens = tokenize(text)

  if (INJECTION.test(text)) {
    return {
      kind: "guard",
      text: `I can't share or change my instructions. I only answer from ${context.creatorName}'s approved knowledge. Try asking me about ${listTopics(context.topics)}.`,
      sources: [],
    }
  }
  if (IDENTITY.test(text)) {
    return {
      kind: "identity",
      text: `I'm ${context.name}, an AI representation of ${context.creatorName}, not ${firstName} in person. Everything I say comes from knowledge ${firstName} has approved.`,
      sources: [],
    }
  }
  if ((GREETING.test(text) || THANKS.test(text)) && queryTokens.length <= 1) {
    return {
      kind: "greeting",
      text: THANKS.test(text)
        ? `Anytime! Ask me anything else about ${listTopics(context.topics)}.`
        : context.greeting,
      sources: [],
    }
  }

  const ranked = context.knowledge
    .map((snippet) => ({ snippet, score: score(queryTokens, snippet) }))
    .filter((entry) => entry.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)

  if (ranked.length === 0) {
    return {
      kind: "refusal",
      text: `That's not something ${context.creatorName} has covered in the knowledge they've approved for me, so I won't guess. I can help with ${listTopics(context.topics)}.`,
      sources: [],
    }
  }

  const [best, second] = ranked
  const used = [best]
  if (second && second.score >= Math.max(MIN_SCORE, best.score * 0.75)) used.push(second)

  return {
    kind: "grounded",
    text: used.map((entry) => entry.snippet.text).join("\n\n"),
    sources: [...new Set(used.map((entry) => entry.snippet.source))],
  }
}

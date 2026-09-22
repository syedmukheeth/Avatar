"use client"

import { useSyncExternalStore } from "react"

import type { ChatCharacter } from "@/components/chat/chat-panel"
import { DEMO_CHARACTERS, type KnowledgeSnippet } from "@/lib/demo/characters"

// The demo creator's studio, kept in this browser's localStorage. Nothing is uploaded anywhere.

export type KnowledgeStatus = "queued" | "processing" | "ready"
export type VoiceStatus = "not_setup" | "processing" | "ready"

export type StudioKnowledge = {
  id: string
  title: string
  type: "pdf" | "text" | "note"
  status: KnowledgeStatus
  chunks: number
  snippets: KnowledgeSnippet[]
  /** PDFs are only simulated in the demo: text extraction runs server-side in the live product. */
  simulated?: boolean
}

export type StudioCharacter = {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  hue: number
  personality: string
  instructions: string
  status: "draft" | "published"
  voice: VoiceStatus
  knowledge: StudioKnowledge[]
  conversations: number
  suggested: string[]
}

type StudioState = { version: 1; characters: StudioCharacter[] }

const STORAGE_KEY = "mindlink-demo-studio-v1"

/** Splits pasted or uploaded text into retrievable chunks, like the ingestion worker does. */
export function toSnippets(text: string, source: string): KnowledgeSnippet[] {
  const pieces: string[] = []
  for (const paragraph of text.split(/\n\s*\n/)) {
    const clean = paragraph.replace(/\s+/g, " ").trim()
    if (!clean) continue
    if (clean.length <= 500) {
      pieces.push(clean)
      continue
    }
    let current = ""
    for (const sentence of clean.match(/[^.!?]+[.!?]*/g) ?? [clean]) {
      if ((current + sentence).length > 500 && current) {
        pieces.push(current.trim())
        current = ""
      }
      current += sentence
    }
    if (current.trim()) pieces.push(current.trim())
  }
  return pieces.map((piece, index) => ({ id: `${source}-${index}`, source, text: piece }))
}

function seed(): StudioState {
  const maya = DEMO_CHARACTERS.find((character) => character.slug === "coach-maya")!
  const bySource = new Map<string, KnowledgeSnippet[]>()
  for (const snippet of maya.knowledge) {
    bySource.set(snippet.source, [...(bySource.get(snippet.source) ?? []), snippet])
  }
  const mealPrepNote =
    "Batch-cook two proteins on Sunday, like tandoori chicken and chickpea curry, so weekday lunches take five minutes.\n\nEvery meal-prep box gets a palm of protein, a fist of carbs like rice or roti, and two handfuls of vegetables.\n\nCooked meals keep for about three days in the fridge. Freeze anything meant for Thursday onwards."

  return {
    version: 1,
    characters: [
      {
        id: "coach-maya",
        slug: "coach-maya",
        name: maya.name,
        tagline: maya.tagline,
        description: maya.description,
        hue: maya.hue,
        personality:
          "Warm, direct and encouraging. Short sentences, practical steps, a little humour. Never shames anyone for their starting point.",
        instructions:
          "Give general fitness guidance from my programs only. For injuries, pain or medical conditions, tell people to see a professional. Don't recommend supplements beyond protein.",
        status: "published",
        voice: "ready",
        knowledge: [...bySource].map(([title, snippets], index) => ({
          id: `seed-${index}`,
          title,
          type: title.endsWith(".pdf") ? "pdf" : "text",
          status: "ready",
          chunks: snippets.length * 3,
          snippets,
        })),
        conversations: maya.conversations,
        suggested: maya.suggested,
      },
      {
        id: "meal-prep-desk",
        slug: "meal-prep-desk",
        name: "Maya's Meal Prep Desk",
        tagline: "Simple high-protein meals for busy weeks.",
        description: "Quick answers on planning, cooking and storing a week of meals.",
        hue: 95,
        personality: "",
        instructions: "",
        status: "draft",
        voice: "not_setup",
        knowledge: [
          {
            id: "seed-note",
            title: "Sunday meal prep basics",
            type: "note",
            status: "ready",
            chunks: 1,
            snippets: toSnippets(mealPrepNote, "Sunday meal prep basics"),
          },
        ],
        conversations: 0,
        suggested: ["How long do meal prep boxes last?", "What goes in a meal prep box?"],
      },
    ],
  }
}

// Simulated jobs cannot outlive the page that ran them; settle anything left mid-flight.
function settle(state: StudioState): StudioState {
  return {
    ...state,
    characters: state.characters.map((character) => ({
      ...character,
      voice: character.voice === "processing" ? "ready" : character.voice,
      knowledge: character.knowledge.map((item) =>
        item.status === "ready" ? item : { ...item, status: "ready" },
      ),
    })),
  }
}

function load(): StudioState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StudioState
      if (parsed?.version === 1 && Array.isArray(parsed.characters)) return settle(parsed)
    }
  } catch {
    // Blocked or corrupt storage: fall back to the seed.
  }
  return seed()
}

const listeners = new Set<() => void>()
const serverState = seed()
let state: StudioState | null = null

function getSnapshot(): StudioState {
  state ??= load()
  return state
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function commit(next: StudioState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage is a convenience in the demo; the in-memory state still works.
  }
  listeners.forEach((listener) => listener())
}

export function useStudio(): StudioState {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverState)
}

export function updateCharacter(
  id: string,
  change: Partial<StudioCharacter> | ((character: StudioCharacter) => Partial<StudioCharacter>),
) {
  const current = getSnapshot()
  commit({
    ...current,
    characters: current.characters.map((character) =>
      character.id === id
        ? { ...character, ...(typeof change === "function" ? change(character) : change) }
        : character,
    ),
  })
}

export function updateKnowledge(
  characterId: string,
  knowledgeId: string,
  change: Partial<StudioKnowledge>,
) {
  updateCharacter(characterId, (character) => ({
    knowledge: character.knowledge.map((item) =>
      item.id === knowledgeId ? { ...item, ...change } : item,
    ),
  }))
}

export function createDraft(): string {
  const id = `draft-${crypto.randomUUID().slice(0, 8)}`
  const current = getSnapshot()
  commit({
    ...current,
    characters: [
      ...current.characters,
      {
        id,
        slug: id,
        name: "Untitled character",
        tagline: "",
        description: "",
        hue: [25, 155, 205, 262, 318, 70][current.characters.length % 6],
        personality: "",
        instructions: "",
        status: "draft",
        voice: "not_setup",
        knowledge: [],
        conversations: 0,
        suggested: [],
      },
    ],
  })
  return id
}

export function resetStudio() {
  commit(seed())
}

export function studioChatCharacter(
  character: StudioCharacter,
  creatorName: string,
): ChatCharacter {
  return {
    name: character.name,
    creatorName,
    hue: character.hue,
    topics: character.knowledge.length
      ? character.knowledge.slice(0, 3).map((item) => item.title.replace(/\.(pdf|txt)$/i, ""))
      : ["the knowledge you add"],
    greeting:
      character.knowledge.length > 0
        ? "Test me: ask something your knowledge covers, then something it doesn't."
        : "Add a note or file in Knowledge, then ask me about it here.",
    suggested: character.suggested,
    knowledge: character.knowledge
      .filter((item) => item.status === "ready")
      .flatMap((item) => item.snippets),
  }
}

import type { ChatCharacter } from "@/components/chat/chat-panel"
import type { DemoCharacter } from "@/lib/demo/characters"

/** The serialisable subset client components need. */
export function toChatCharacter(character: DemoCharacter): ChatCharacter {
  return {
    name: character.name,
    creatorName: character.creatorName,
    hue: character.hue,
    topics: character.topics,
    greeting: character.greeting,
    suggested: character.suggested,
    knowledge: character.knowledge,
    voice: character.voice,
  }
}

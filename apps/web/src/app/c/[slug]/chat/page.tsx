import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ChatPanelClient } from "@/components/chat/chat-panel-client"
import { CharacterTopBar } from "@/components/character-top-bar"
import { getDemoCharacter } from "@/lib/demo/characters"
import { toChatCharacter } from "@/lib/demo/chat-character"
import { demoMode } from "@/lib/env"
import { firstParam } from "@/lib/search-params"

export async function generateMetadata({ params }: PageProps<"/c/[slug]/chat">): Promise<Metadata> {
  const character = demoMode ? getDemoCharacter((await params).slug) : undefined
  return character ? { title: `Chat with ${character.name}` } : {}
}

export default async function ChatPage({ params, searchParams }: PageProps<"/c/[slug]/chat">) {
  const character = demoMode ? getDemoCharacter((await params).slug) : undefined
  if (!character) notFound()
  const question = firstParam((await searchParams).q)?.slice(0, 500)

  return (
    <div className="flex h-dvh flex-col">
      <CharacterTopBar character={character} current="chat" />
      <main className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <ChatPanelClient
          character={toChatCharacter(character)}
          storageKey={`mindlink-chat-${character.slug}`}
          initialQuestion={question}
        />
      </main>
    </div>
  )
}

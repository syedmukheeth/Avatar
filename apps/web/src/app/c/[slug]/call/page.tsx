import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { VoiceCallClient } from "@/app/c/[slug]/call/voice-call-client"
import { CharacterTopBar } from "@/components/character-top-bar"
import { aiEnabled } from "@/lib/ai/gemini"
import { Button } from "@/components/ui/button"
import { getDemoCharacter } from "@/lib/demo/characters"
import { toChatCharacter } from "@/lib/demo/chat-character"
import { demoMode } from "@/lib/env"

export async function generateMetadata({ params }: PageProps<"/c/[slug]/call">): Promise<Metadata> {
  const character = demoMode ? getDemoCharacter((await params).slug) : undefined
  return character ? { title: `Call ${character.name}` } : {}
}

export default async function CallPage({ params }: PageProps<"/c/[slug]/call">) {
  const character = demoMode ? getDemoCharacter((await params).slug) : undefined
  if (!character) notFound()

  return (
    <div className="flex min-h-dvh flex-col">
      <CharacterTopBar character={character} current="call" />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4">
        {character.voiceReady ? (
          <VoiceCallClient
            character={toChatCharacter(character)}
            slug={aiEnabled() ? character.slug : undefined}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-3xl font-medium">Voice is on its way</h1>
            <p className="max-w-sm text-muted-foreground">
              {character.creatorName} hasn&apos;t recorded a voice yet. You can chat with{" "}
              {character.name} right now.
            </p>
            <Button asChild className="rounded-full">
              <Link href={`/c/${character.slug}/chat`}>Open chat</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

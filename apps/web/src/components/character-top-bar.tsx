import { ArrowLeft, MessageCircle, Phone } from "lucide-react"
import Link from "next/link"

import { CharacterAvatar } from "@/components/character-avatar"
import { DemoBanner } from "@/components/demo-banner"
import { Button } from "@/components/ui/button"
import type { DemoCharacter } from "@/lib/demo/characters"

type Props = {
  character: DemoCharacter
  current: "chat" | "call"
}

/** Slim header for the chat and call screens, where the conversation owns the page. */
export function CharacterTopBar({ character, current }: Props) {
  return (
    <>
      <DemoBanner />
      <header className="border-b border-border/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon" aria-label={`Back to ${character.name}`}>
            <Link href={`/c/${character.slug}`}>
              <ArrowLeft />
            </Link>
          </Button>
          <CharacterAvatar name={character.creatorName} hue={character.hue} size={36} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-tight font-semibold">
              {character.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              AI representation of {character.creatorName}
            </p>
          </div>
          <div className="ml-auto">
            {current === "chat" && character.voiceReady && (
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/c/${character.slug}/call`}>
                  <Phone /> Call
                </Link>
              </Button>
            )}
            {current === "call" && (
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/c/${character.slug}/chat`}>
                  <MessageCircle /> Chat instead
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

import { AudioLines, MessageCircle } from "lucide-react"
import Link from "next/link"

import { CharacterAvatar } from "@/components/character-avatar"
import type { DemoCharacter } from "@/lib/demo/characters"

type Props = {
  character: Pick<
    DemoCharacter,
    | "slug"
    | "name"
    | "creatorName"
    | "profession"
    | "tagline"
    | "hue"
    | "topics"
    | "conversations"
    | "voiceReady"
  >
}

export function CharacterCard({ character }: Props) {
  return (
    <Link
      href={`/c/${character.slug}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-20px_oklch(0.5_0.15_278/0.35)]"
    >
      <div
        aria-hidden
        className="absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `oklch(0.85 0.1 ${character.hue})` }}
      />
      <div className="relative flex items-start gap-4">
        <CharacterAvatar name={character.creatorName} hue={character.hue} size={52} />
        <div className="min-w-0">
          <h3 className="truncate text-lg leading-tight font-semibold">{character.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            by {character.creatorName} · {character.profession}
          </p>
        </div>
      </div>
      <p className="relative text-[15px] leading-snug">{character.tagline}</p>
      <div className="relative flex flex-wrap gap-1.5">
        {character.topics.slice(0, 3).map((topic) => (
          <span
            key={topic}
            className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          >
            {topic}
          </span>
        ))}
      </div>
      <div className="relative mt-auto flex items-center justify-between border-t border-dashed pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5" aria-hidden />
          {character.conversations.toLocaleString("en-US")} conversations
        </span>
        {character.voiceReady && (
          <span className="flex items-center gap-1.5 text-accent-foreground">
            <AudioLines className="size-3.5" aria-hidden />
            Voice calls
          </span>
        )}
      </div>
    </Link>
  )
}

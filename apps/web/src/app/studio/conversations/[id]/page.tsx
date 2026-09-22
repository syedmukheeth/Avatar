import { ArrowLeft, FileText, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CharacterAvatar } from "@/components/character-avatar"
import { Button } from "@/components/ui/button"
import { getDemoCharacter } from "@/lib/demo/characters"
import { getDemoConversation } from "@/lib/demo/conversations"
import { demoMode } from "@/lib/env"

export const metadata: Metadata = { title: "Transcript" }

export default async function TranscriptPage({ params }: PageProps<"/studio/conversations/[id]">) {
  const conversation = demoMode ? getDemoConversation((await params).id) : undefined
  if (!conversation) notFound()
  const character = getDemoCharacter(conversation.characterSlug)

  return (
    <div className="flex animate-rise flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to conversations">
          <Link href="/studio/conversations">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-medium">{conversation.audienceName}</h1>
          <p className="text-sm text-muted-foreground">
            {conversation.channel === "voice" ? "Voice call" : "Chat"} with {character?.name}
          </p>
        </div>
      </div>

      <ol className="flex max-w-3xl flex-col gap-5 rounded-2xl border bg-card p-5">
        {conversation.messages.map((message, index) =>
          message.role === "user" ? (
            <li key={index} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5">
                {message.text}
              </p>
            </li>
          ) : (
            <li key={index} className="flex items-start gap-3">
              {character && (
                <CharacterAvatar name={character.creatorName} hue={character.hue} size={28} />
              )}
              <div className="flex max-w-[80%] flex-col gap-2">
                <p className="rounded-2xl rounded-bl-md border px-4 py-2.5">{message.text}</p>
                {message.sources?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {message.sources.map((source) => (
                      <span
                        key={source}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs text-accent-foreground"
                      >
                        <FileText className="size-3" aria-hidden /> {source}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-success" aria-hidden />
                    Declined: outside approved knowledge
                  </span>
                )}
              </div>
            </li>
          ),
        )}
      </ol>
      <p className="text-xs text-muted-foreground">
        Tip: questions your AI declines show you what to add to its knowledge next.
      </p>
    </div>
  )
}

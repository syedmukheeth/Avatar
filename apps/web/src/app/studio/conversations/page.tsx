import { MessageCircle, Phone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getDemoCharacter } from "@/lib/demo/characters"
import { DEMO_CONVERSATIONS } from "@/lib/demo/conversations"
import { demoMode } from "@/lib/env"

export const metadata: Metadata = { title: "Conversations" }

const when = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
})

export default function ConversationsPage() {
  if (!demoMode) notFound()

  return (
    <div className="flex animate-rise flex-col gap-6">
      <div>
        <h1 className="text-4xl font-medium">Conversations</h1>
        <p className="mt-1 text-muted-foreground">
          Every chat and call with your characters, with the knowledge each answer used.
        </p>
      </div>
      <ul className="divide-y rounded-2xl border bg-card">
        {DEMO_CONVERSATIONS.map((conversation) => (
          <li key={conversation.id}>
            <Link
              href={`/studio/conversations/${conversation.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                {conversation.channel === "voice" ? (
                  <Phone className="size-4" aria-label="Voice call" />
                ) : (
                  <MessageCircle className="size-4" aria-label="Chat" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {conversation.audienceName}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {getDemoCharacter(conversation.characterSlug)?.name}
                  </span>
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {conversation.messages[0]?.text}
                </p>
              </div>
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                <p>{when.format(new Date(conversation.startedAt))}</p>
                <p>{conversation.messages.length} messages</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

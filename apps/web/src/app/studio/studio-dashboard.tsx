"use client"

import { AudioLines, FileText, MessageCircle, Phone, Plus, RotateCcw } from "lucide-react"
import Link from "next/link"

import { CharacterAvatar } from "@/components/character-avatar"
import { Button } from "@/components/ui/button"
import type { DemoConversation } from "@/lib/demo/conversations"
import { resetStudio, useStudio } from "@/lib/demo/studio-store"
import { cn } from "@/lib/utils"

type Props = {
  creatorName: string
  conversations: DemoConversation[]
}

export function StudioDashboard({ creatorName, conversations }: Props) {
  const { characters } = useStudio()
  const firstName = creatorName.split(" ")[0]
  const totalConversations = characters.reduce((sum, character) => sum + character.conversations, 0)
  const published = characters.filter((character) => character.status === "published").length

  const stats = [
    {
      label: "Conversations",
      value: totalConversations.toLocaleString("en-US"),
      icon: MessageCircle,
    },
    { label: "Voice minutes this week", value: "412", icon: Phone },
    {
      label: "Published characters",
      value: `${published} / ${characters.length}`,
      icon: AudioLines,
    },
    {
      label: "Knowledge sources",
      value: characters.reduce((sum, character) => sum + character.knowledge.length, 0).toString(),
      icon: FileText,
    },
  ]

  return (
    <div className="flex animate-rise flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Creator studio</p>
          <h1 className="text-4xl font-medium">Good to see you, {firstName}</h1>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/studio/characters/new">
            <Plus /> New character
          </Link>
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4" aria-hidden /> {label}
            </dt>
            <dd className="mt-2 font-display text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="text-2xl font-medium">Your characters</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {characters.map((character) => (
            <li key={character.id}>
              <Link
                href={`/studio/characters/${character.id}`}
                className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <CharacterAvatar name={creatorName} hue={character.hue} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{character.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {character.tagline || "No tagline yet"}
                  </p>
                </div>
                <div className="hidden items-center gap-2 text-xs sm:flex">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                    {character.knowledge.length} sources
                  </span>
                  {character.voice === "ready" && (
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-accent-foreground">
                      Voice
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    character.status === "published"
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {character.status === "published" ? "Published" : "Draft"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-medium">Recent conversations</h2>
          <Link
            href="/studio/conversations"
            className="text-sm font-medium text-accent-foreground hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="mt-4 divide-y rounded-2xl border bg-card">
          {conversations.slice(0, 3).map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/studio/conversations/${conversation.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  {conversation.channel === "voice" ? (
                    <Phone className="size-4" aria-hidden />
                  ) : (
                    <MessageCircle className="size-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{conversation.audienceName}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {conversation.messages[0]?.text}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={resetStudio}
        className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="size-3.5" aria-hidden /> Reset studio data
      </button>
    </div>
  )
}

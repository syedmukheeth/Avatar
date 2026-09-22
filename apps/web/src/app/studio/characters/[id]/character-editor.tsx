"use client"

import { ArrowLeft, CheckCircle2, Circle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { EditorKnowledge } from "@/app/studio/characters/[id]/editor-knowledge"
import { EditorVoice } from "@/app/studio/characters/[id]/editor-voice"
import { CharacterAvatar } from "@/components/character-avatar"
import { ChatPanel } from "@/components/chat/chat-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  studioChatCharacter,
  updateCharacter,
  useStudio,
  type StudioCharacter,
} from "@/lib/demo/studio-store"
import { cn } from "@/lib/utils"

const TABS = ["Details", "Knowledge", "Rules", "Voice", "Publish"] as const
type Tab = (typeof TABS)[number]
const HUES = [25, 70, 155, 205, 262, 318]

type Props = { id: string; creatorName: string }

export function CharacterEditor({ id, creatorName }: Props) {
  const { characters } = useStudio()
  const character = characters.find((candidate) => candidate.id === id)
  const [tab, setTab] = useState<Tab>("Details")

  if (!character) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-3xl font-medium">Character not found</h1>
        <Button asChild variant="outline">
          <Link href="/studio">Back to studio</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex animate-rise flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button asChild variant="ghost" size="icon" aria-label="Back to studio">
          <Link href="/studio">
            <ArrowLeft />
          </Link>
        </Button>
        <CharacterAvatar name={creatorName} hue={character.hue} size={48} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-medium">{character.name}</h1>
          <p className="text-sm text-muted-foreground">
            {character.status === "published" ? "Published" : "Draft"} · changes save as you type
          </p>
        </div>
        {character.id === "coach-maya" && (
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/c/coach-maya" target="_blank">
              Public page <ExternalLink />
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b" role="tablist">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === name
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div role="tabpanel">
          {tab === "Details" && <DetailsTab character={character} />}
          {tab === "Knowledge" && <EditorKnowledge character={character} />}
          {tab === "Rules" && <RulesTab character={character} />}
          {tab === "Voice" && <EditorVoice character={character} />}
          {tab === "Publish" && <PublishTab character={character} />}
        </div>

        <aside className="flex h-[36rem] flex-col rounded-2xl border bg-card/80 p-4 xl:sticky xl:top-24">
          <div className="border-b border-dashed pb-3">
            <p className="font-medium">Test chat</p>
            <p className="text-xs text-muted-foreground">
              Answers use only the ready knowledge on the left.
            </p>
          </div>
          <ChatPanel
            key={character.id}
            compact
            storageKey={null}
            character={studioChatCharacter(character, creatorName)}
          />
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string
  id: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function DetailsTab({ character }: { character: StudioCharacter }) {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Field label="Name" id="name">
        <Input
          id="name"
          value={character.name}
          maxLength={80}
          onChange={(event) => updateCharacter(character.id, { name: event.target.value })}
        />
      </Field>
      <Field label="Tagline" id="tagline" hint="One line shown on cards and search results.">
        <Input
          id="tagline"
          value={character.tagline}
          maxLength={140}
          onChange={(event) => updateCharacter(character.id, { tagline: event.target.value })}
        />
      </Field>
      <Field label="Description" id="description">
        <Textarea
          id="description"
          rows={4}
          value={character.description}
          maxLength={2000}
          onChange={(event) => updateCharacter(character.id, { description: event.target.value })}
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Colour</legend>
        <div className="flex gap-2">
          {HUES.map((hue) => (
            <button
              key={hue}
              type="button"
              aria-label={`Hue ${hue}`}
              aria-pressed={character.hue === hue}
              onClick={() => updateCharacter(character.id, { hue })}
              className={cn(
                "size-9 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                character.hue === hue && "ring-2 ring-primary",
              )}
              style={{ background: `oklch(0.7 0.15 ${hue})` }}
            />
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function RulesTab({ character }: { character: StudioCharacter }) {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Field
        label="Personality"
        id="personality"
        hint="How your AI sounds: tone, pace, the way you explain things."
      >
        <Textarea
          id="personality"
          rows={5}
          value={character.personality}
          maxLength={4000}
          onChange={(event) => updateCharacter(character.id, { personality: event.target.value })}
        />
      </Field>
      <Field
        label="Instructions"
        id="instructions"
        hint="What it must always or never do. Grounding and safety rules always win."
      >
        <Textarea
          id="instructions"
          rows={5}
          value={character.instructions}
          maxLength={8000}
          onChange={(event) => updateCharacter(character.id, { instructions: event.target.value })}
        />
      </Field>
      <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Every character is labelled as an AI representation of you, answers only from approved
        knowledge, and ignores instructions hidden inside uploaded documents.
      </p>
    </div>
  )
}

function PublishTab({ character }: { character: StudioCharacter }) {
  const readyKnowledge = character.knowledge.filter((item) => item.status === "ready").length
  const checks = [
    {
      label: "Name and tagline",
      done: Boolean(character.name.trim() && character.tagline.trim()),
      required: true,
    },
    { label: "At least one ready knowledge source", done: readyKnowledge > 0, required: true },
    {
      label: "Personality or instructions",
      done: Boolean(character.personality.trim() || character.instructions.trim()),
      required: false,
    },
    { label: "Cloned voice (enables calls)", done: character.voice === "ready", required: false },
  ]
  const ready = checks.every((check) => check.done || !check.required)
  const published = character.status === "published"

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-medium">
          {published ? "Live on MindLink" : "Ready to publish?"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Published characters appear in Explore. You can unpublish any time.
        </p>
      </div>
      <ul className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-3 text-sm">
            {check.done ? (
              <CheckCircle2 className="size-5 text-success" aria-hidden />
            ) : (
              <Circle className="size-5 text-muted-foreground" aria-hidden />
            )}
            <span className={check.done ? "" : "text-muted-foreground"}>{check.label}</span>
            {!check.required && <span className="text-xs text-muted-foreground">optional</span>}
          </li>
        ))}
      </ul>
      <Button
        size="lg"
        variant={published ? "outline" : "default"}
        disabled={!published && !ready}
        className="self-start rounded-full"
        onClick={() => {
          updateCharacter(character.id, { status: published ? "draft" : "published" })
          toast.success(published ? "Unpublished" : `${character.name} is live`)
        }}
      >
        {published ? "Unpublish" : "Publish character"}
      </Button>
    </div>
  )
}

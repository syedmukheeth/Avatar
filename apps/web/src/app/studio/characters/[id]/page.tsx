import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CharacterEditorClient } from "@/app/studio/characters/[id]/character-editor-client"
import { DEMO_CREATOR } from "@/lib/demo/session"
import { demoMode } from "@/lib/env"

export const metadata: Metadata = { title: "Edit character" }

export default async function EditCharacterPage({ params }: PageProps<"/studio/characters/[id]">) {
  if (!demoMode) notFound() // The live editor ships with the knowledge pipeline.
  const { id } = await params
  return <CharacterEditorClient id={id} creatorName={DEMO_CREATOR.displayName} />
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CreateDraft } from "@/app/studio/characters/new/create-draft"
import { demoMode } from "@/lib/env"

export const metadata: Metadata = { title: "New character" }

export default function NewCharacterPage() {
  if (!demoMode) notFound()
  return <CreateDraft />
}

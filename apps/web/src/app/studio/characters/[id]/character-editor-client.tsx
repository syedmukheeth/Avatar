"use client"

import dynamic from "next/dynamic"

/** Studio data lives in localStorage, so the editor renders in the browser only. */
export const CharacterEditorClient = dynamic(
  () =>
    import("@/app/studio/characters/[id]/character-editor").then(
      (module) => module.CharacterEditor,
    ),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted-foreground">Loading character…</p>,
  },
)

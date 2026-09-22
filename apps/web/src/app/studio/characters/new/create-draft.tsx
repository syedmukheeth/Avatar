"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { createDraft } from "@/lib/demo/studio-store"

/** Creates an empty draft in the demo studio and opens it in the editor. */
export function CreateDraft() {
  const router = useRouter()
  const created = useRef(false)

  useEffect(() => {
    if (created.current) return
    created.current = true
    router.replace(`/studio/characters/${createDraft()}`)
  }, [router])

  return <p className="text-sm text-muted-foreground">Creating a new character…</p>
}

"use client"

import dynamic from "next/dynamic"

/** Browser speech APIs only exist on the client, so the call UI never renders on the server. */
export const VoiceCallClient = dynamic(
  () => import("@/app/c/[slug]/call/voice-call").then((module) => module.VoiceCall),
  { ssr: false },
)

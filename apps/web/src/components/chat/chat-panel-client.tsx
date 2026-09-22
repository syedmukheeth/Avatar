"use client"

import dynamic from "next/dynamic"

/** The chat reads history from localStorage on first render, so it renders in the browser only. */
export const ChatPanelClient = dynamic(
  () => import("@/components/chat/chat-panel").then((module) => module.ChatPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    ),
  },
)

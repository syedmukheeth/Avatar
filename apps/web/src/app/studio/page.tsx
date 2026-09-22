import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { StudioDashboardClient } from "@/app/studio/studio-dashboard-client"
import { getViewer } from "@/lib/auth/viewer"
import { DEMO_CONVERSATIONS } from "@/lib/demo/conversations"
import { DEMO_CREATOR } from "@/lib/demo/session"
import { demoMode } from "@/lib/env"

export const metadata: Metadata = { title: "Studio" }

export default async function StudioDashboardPage() {
  const viewer = await getViewer()
  if (!viewer?.creatorId) redirect("/studio/profile")

  if (demoMode) {
    return (
      <StudioDashboardClient
        creatorName={DEMO_CREATOR.displayName}
        conversations={DEMO_CONVERSATIONS}
      />
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-medium">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Your characters will appear here.</p>
    </div>
  )
}

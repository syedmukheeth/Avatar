import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getViewer } from "@/lib/auth/viewer"

export const metadata: Metadata = { title: "Studio" }

export default async function StudioDashboardPage() {
  const viewer = await getViewer()
  if (!viewer?.creatorId) redirect("/studio/profile")

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Your characters will appear here.</p>
    </div>
  )
}

"use client"

import dynamic from "next/dynamic"

/** Studio data lives in localStorage, so the dashboard renders in the browser only. */
export const StudioDashboardClient = dynamic(
  () => import("@/app/studio/studio-dashboard").then((module) => module.StudioDashboard),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted-foreground">Loading your studio…</p>,
  },
)

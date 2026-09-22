import type { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = { title: "Explore" }

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Explore characters</h1>
        <p className="mt-2 text-muted-foreground">Published characters will appear here.</p>
      </main>
    </>
  )
}

import type { Metadata } from "next"

import { ExploreGrid } from "@/app/explore/explore-grid"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { DEMO_CHARACTERS } from "@/lib/demo/characters"
import { demoMode } from "@/lib/env"

export const metadata: Metadata = { title: "Explore characters" }

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <p className="text-sm font-medium tracking-wide text-accent-foreground uppercase">
          Explore
        </p>
        <h1 className="mt-1 text-5xl font-medium">Find someone worth asking</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Every character is built by a real creator from their own approved knowledge. Chat for
          free, or call the ones with a voice.
        </p>
        {demoMode ? (
          <ExploreGrid characters={DEMO_CHARACTERS} />
        ) : (
          <p className="mt-10 text-muted-foreground">Published characters will appear here.</p>
        )}
      </main>
      <SiteFooter />
    </>
  )
}

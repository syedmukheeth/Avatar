import Link from "next/link"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24">
        <p className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-accent-foreground">
          AI characters of real creators
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Talk to the AI version of the people you learn from.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Every character is built by the creator from their own approved knowledge, persona and
          voice. Chat or call in the browser. Answers stay grounded in what they actually taught.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/explore">Explore characters</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login?as=creator">Create your AI character</Link>
          </Button>
        </div>
      </main>
    </>
  )
}

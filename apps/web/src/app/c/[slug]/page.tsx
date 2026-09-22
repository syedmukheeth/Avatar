import { ArrowRight, BadgeCheck, MessageCircle, Phone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CharacterAvatar } from "@/components/character-avatar"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { VoiceOrb } from "@/components/voice-orb"
import { getDemoCharacter, knowledgeSources } from "@/lib/demo/characters"
import { demoMode } from "@/lib/env"

function findCharacter(slug: string) {
  return demoMode ? getDemoCharacter(slug) : undefined
}

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const character = findCharacter((await params).slug)
  if (!character) return {}
  return {
    title: character.name,
    description: `${character.tagline} An AI representation of ${character.creatorName}.`,
  }
}

export default async function CharacterPage({ params }: PageProps<"/c/[slug]">) {
  const character = findCharacter((await params).slug)
  if (!character) notFound()

  const sources = knowledgeSources(character).length
  const firstName = character.creatorName.split(" ")[0]

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[auto_1fr]">
          <div className="mx-auto animate-rise">
            <VoiceOrb hue={character.hue} state="idle" size={220} />
          </div>
          <div className="flex flex-col items-start gap-5">
            <p
              className="inline-flex animate-rise items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm text-accent-foreground ring-1 ring-primary/20"
              style={{ animationDelay: "60ms" }}
            >
              <BadgeCheck className="size-4" aria-hidden />
              AI representation of {character.creatorName}
            </p>
            <h1
              className="animate-rise text-5xl leading-[1.05] font-medium sm:text-6xl"
              style={{ animationDelay: "120ms" }}
            >
              {character.name}
            </h1>
            <p
              className="max-w-xl animate-rise text-xl text-muted-foreground"
              style={{ animationDelay: "180ms" }}
            >
              {character.tagline}
            </p>
            <div className="flex animate-rise flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
                <Link href={`/c/${character.slug}/chat`}>
                  <MessageCircle /> Start chatting
                </Link>
              </Button>
              {character.voiceReady ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full bg-card/60 px-6 text-base"
                >
                  <Link href={`/c/${character.slug}/call`}>
                    <Phone /> Call {firstName}&apos;s AI
                  </Link>
                </Button>
              ) : (
                <span className="self-center text-sm text-muted-foreground">
                  Voice calls coming soon
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-10">
            <div>
              <h2 className="text-2xl font-medium">About</h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                {character.description}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-medium">Try asking</h2>
              <ul className="mt-4 divide-y rounded-2xl border bg-card">
                {character.suggested.map((question) => (
                  <li key={question}>
                    <Link
                      href={`/c/${character.slug}/chat?q=${encodeURIComponent(question)}`}
                      className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-primary-soft/40"
                    >
                      <span>{question}</span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="flex h-fit flex-col gap-6 rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <CharacterAvatar name={character.creatorName} hue={character.hue} size={48} />
              <div>
                <p className="font-medium">{character.creatorName}</p>
                <p className="text-sm text-muted-foreground">{character.profession}</p>
              </div>
            </div>
            <div>
              <h3 className="font-sans text-sm font-medium text-muted-foreground">Knows about</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {character.topics.map((topic) => (
                  <span key={topic} className="rounded-full bg-muted px-2.5 py-1 text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 border-t border-dashed pt-5 text-sm">
              <div>
                <dt className="text-muted-foreground">Approved sources</dt>
                <dd className="font-display text-2xl">{sources}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Conversations</dt>
                <dd className="font-display text-2xl">
                  {character.conversations.toLocaleString("en-US")}
                </dd>
              </div>
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This AI answers only from knowledge {firstName} approved. It will say so when it
              doesn&apos;t know, and it isn&apos;t {firstName} in person.
            </p>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

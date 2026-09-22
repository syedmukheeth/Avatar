import { ArrowRight, AudioLines, BadgeCheck, FileText, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { CharacterAvatar } from "@/components/character-avatar"
import { CharacterCard } from "@/components/character-card"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { VoiceOrb } from "@/components/voice-orb"
import { DEMO_CHARACTERS } from "@/lib/demo/characters"
import { demoMode } from "@/lib/env"

const STEPS = [
  {
    title: "Upload what you know",
    body: "Course notes, PDFs, FAQs, the answers you give every week. Only what you approve becomes knowledge.",
  },
  {
    title: "Shape the persona and voice",
    body: "Set how your AI talks and what it avoids, then record a minute of audio to clone your voice.",
  },
  {
    title: "Publish and let it work",
    body: "Your audience chats or calls any time. You read every conversation and see what people ask.",
  },
]

const PRINCIPLES = [
  {
    icon: FileText,
    title: "Grounded, with receipts",
    body: "Answers come from the creator's approved knowledge and show where they came from.",
  },
  {
    icon: ShieldCheck,
    title: "Says “I don't know”",
    body: "Outside that knowledge it declines instead of inventing. No made-up facts, ever.",
  },
  {
    icon: BadgeCheck,
    title: "Always labelled AI",
    body: "Every character is an AI representation of a named creator, never passed off as the person.",
  },
]

export default function LandingPage() {
  const maya = DEMO_CHARACTERS[0]
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div className="flex flex-col items-start gap-7">
            <p className="animate-rise rounded-full border border-primary/20 bg-card/70 px-3 py-1 text-sm text-accent-foreground backdrop-blur">
              AI characters of real creators
            </p>
            <h1
              className="animate-rise text-5xl leading-[1.02] font-medium sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              The people you learn from,{" "}
              <em className="font-normal whitespace-nowrap text-primary">on call.</em>
            </h1>
            <p
              className="max-w-xl animate-rise text-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: "160ms" }}
            >
              Coaches, founders and teachers turn their knowledge and voice into an AI you can chat
              with or call from the browser. It answers only from what they&apos;ve taught, and
              tells you when it doesn&apos;t know.
            </p>
            <div className="flex animate-rise flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
                <Link href="/explore">
                  Explore characters <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full bg-card/60 px-6 text-base"
              >
                <Link href="/login?as=creator">Build your AI character</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div
              className="absolute -top-10 -right-6 animate-rise"
              style={{ animationDelay: "200ms" }}
            >
              <VoiceOrb hue={maya.hue} state="speaking" size={150} />
            </div>
            <div
              className="relative mt-24 animate-rise rounded-3xl border bg-card/90 p-5 shadow-[0_30px_60px_-30px_oklch(0.35_0.1_278/0.45)] backdrop-blur"
              style={{ animationDelay: "320ms" }}
            >
              <div className="flex items-center gap-3 border-b border-dashed pb-4">
                <CharacterAvatar name={maya.creatorName} hue={maya.hue} size={40} />
                <div>
                  <p className="font-display text-lg leading-tight font-semibold">{maya.name}</p>
                  <p className="text-xs text-muted-foreground">
                    AI representation of {maya.creatorName}
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-xs text-accent-foreground">
                  <AudioLines className="size-3" aria-hidden /> Live
                </span>
              </div>
              <div className="flex flex-col gap-3 pt-4 text-sm">
                <p className="self-end rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground">
                  How often should a beginner train?
                </p>
                <p className="rounded-2xl rounded-bl-md border px-3.5 py-2.5 leading-relaxed">
                  Start with three full-body sessions a week on non-consecutive days. Leave two reps
                  in the tank on every set for the first month.
                </p>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary-soft px-2.5 py-1 text-xs text-accent-foreground">
                  <FileText className="size-3" aria-hidden /> First 12 Weeks program.pdf
                </span>
              </div>
            </div>
          </div>
        </section>

        {demoMode && (
          <section className="mx-auto max-w-6xl px-4 pb-24">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium tracking-wide text-accent-foreground uppercase">
                  On MindLink now
                </p>
                <h2 className="mt-1 text-4xl font-medium">Meet the characters</h2>
              </div>
              <Link
                href="/explore"
                className="hidden items-center gap-1 text-sm font-medium text-accent-foreground hover:underline sm:inline-flex"
              >
                See all <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_CHARACTERS.slice(0, 3).map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <h2 className="max-w-2xl text-4xl font-medium">
            From your expertise to an AI that works while you sleep.
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t pt-6">
                <span className="font-display text-6xl leading-none font-light text-primary/25">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-2xl font-medium">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-ink text-paper">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="text-4xl leading-tight font-medium">
              Built so audiences can trust it, and creators can put their name on it.
            </h2>
            <ul className="grid gap-8 sm:grid-cols-3">
              {PRINCIPLES.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Icon className="size-6 text-primary-soft" aria-hidden />
                  <h3 className="mt-3 text-xl font-medium">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/70">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24">
          <div className="relative overflow-hidden rounded-3xl border bg-card px-8 py-14 sm:px-14">
            <div
              aria-hidden
              className="absolute -right-20 -bottom-24 size-80 rounded-full opacity-60 blur-3xl"
              style={{ background: "oklch(0.85 0.1 285)" }}
            />
            <div className="relative max-w-xl">
              <h2 className="text-4xl font-medium">Your audience has questions at 2 a.m.</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Give them an answer in your words and your voice, from knowledge you control, and
                turn every conversation into income.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 rounded-full px-6 text-base">
                <Link href="/login?as=creator">
                  Create your AI character <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

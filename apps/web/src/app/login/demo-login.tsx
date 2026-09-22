import { ArrowRight, MessageCircle, Sparkles } from "lucide-react"

import { enterDemo } from "@/app/login/demo-actions"
import { BrandMark } from "@/components/site-header"

const OPTIONS = [
  {
    role: "creator",
    icon: Sparkles,
    title: "Explore as a creator",
    body: "Open Maya's studio: build a character, add knowledge, record a voice and publish.",
  },
  {
    role: "user",
    icon: MessageCircle,
    title: "Explore as the audience",
    body: "Browse characters, chat with them and try a voice call in your browser.",
  },
] as const

export function DemoLogin({
  next,
  preferCreator,
}: {
  next: string | null
  preferCreator: boolean
}) {
  const options = preferCreator ? OPTIONS : [...OPTIONS].reverse()
  return (
    <div className="flex w-full max-w-lg animate-rise flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark size={44} />
        <h1 className="text-4xl font-medium">Step into the demo</h1>
        <p className="text-muted-foreground">
          No account needed. Pick a side; you can switch any time by signing out.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {options.map(({ role, icon: Icon, title, body }) => (
          <form key={role} action={enterDemo}>
            <input type="hidden" name="role" value={role} />
            {next && <input type="hidden" name="next" value={next} />}
            <button
              type="submit"
              className="group flex w-full items-center gap-4 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_oklch(0.5_0.15_278/0.4)]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">{body}</span>
              </span>
              <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        The live product signs people in with an email link or Google.
      </p>
    </div>
  )
}

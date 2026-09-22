"use client"

import { MessageCircle, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AccountType } from "@/lib/auth/destination"
import { createClient } from "@/lib/supabase/client"

const OPTIONS: { value: AccountType; title: string; body: string; icon: typeof Sparkles }[] = [
  {
    value: "creator",
    title: "I'm a creator",
    body: "Build an AI version of yourself from your knowledge, persona and voice.",
    icon: Sparkles,
  },
  {
    value: "user",
    title: "I want to talk to creators",
    body: "Chat with and call AI characters of the people you learn from.",
    icon: MessageCircle,
  },
]

type Props = {
  initial: AccountType | null
  next: string | null
}

export function RolePicker({ initial, next }: Props) {
  const router = useRouter()
  const [choice, setChoice] = useState<AccountType | null>(initial)
  const [pending, setPending] = useState(false)

  async function confirm() {
    if (!choice) return
    setPending(true)
    const { error } = await createClient().rpc("choose_account_type", {
      p_account_type: choice,
    })
    if (error) {
      setPending(false)
      toast.error("Could not save your choice. Please try again.")
      return
    }
    router.replace(next ?? (choice === "creator" ? "/studio/profile" : "/explore"))
    router.refresh()
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">How will you use MindLink?</h1>
        <p className="mt-2 text-muted-foreground">
          Audience accounts can become creators later. Creators can always chat with others.
        </p>
      </div>
      <div role="radiogroup" className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(({ value, title, body, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={choice === value}
            onClick={() => setChoice(value)}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-card p-5 text-left transition-colors",
              choice === value
                ? "border-primary ring-2 ring-primary/30"
                : "hover:border-primary/50",
            )}
          >
            <Icon className="size-6 text-primary" aria-hidden />
            <span className="font-medium">{title}</span>
            <span className="text-sm text-muted-foreground">{body}</span>
          </button>
        ))}
      </div>
      <Button size="lg" onClick={confirm} disabled={!choice || pending} className="self-start">
        Continue
      </Button>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type Props = {
  next: string | null
  linkError: boolean
}

export function LoginForm({ next, linkError }: Props) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  function callbackUrl() {
    const url = new URL("/auth/callback", window.location.origin)
    if (next) url.searchParams.set("next", next)
    return url.toString()
  }

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    })
    setPending(false)
    if (error) {
      toast.error("Could not send the sign-in link. Try again in a minute.")
      return
    }
    setSentTo(email)
  }

  async function signInWithGoogle() {
    setPending(true)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    })
    if (error) {
      setPending(false)
      toast.error("Google sign-in is unavailable right now.")
    }
  }

  if (sentTo) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent a sign-in link to <span className="font-medium text-foreground">{sentTo}</span>.
            Open it in this browser to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in to MindLink</CardTitle>
        <CardDescription>New here? The same link creates your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {linkError && (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            That sign-in link is invalid or expired. Request a new one below.
          </p>
        )}
        <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending}>
            Email me a sign-in link
          </Button>
        </form>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" onClick={signInWithGoogle} disabled={pending}>
          Continue with Google
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

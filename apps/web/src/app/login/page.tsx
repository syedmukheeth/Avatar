import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DemoLogin } from "@/app/login/demo-login"
import { LoginForm } from "@/app/login/login-form"
import { DemoBanner } from "@/components/demo-banner"
import { afterSignIn, safeNextPath } from "@/lib/auth/destination"
import { getViewer } from "@/lib/auth/viewer"
import { demoMode } from "@/lib/env"
import { firstParam } from "@/lib/search-params"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams
  const next = safeNextPath(firstParam(params.next))
  const as = firstParam(params.as)

  const viewer = await getViewer()
  if (viewer) redirect(afterSignIn(viewer, next))

  if (demoMode) {
    return (
      <>
        <DemoBanner />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <DemoLogin next={next} preferCreator={as === "creator"} />
        </main>
      </>
    )
  }

  // "Create your AI character" pre-selects the creator role on /welcome.
  const callbackNext = next ?? (as === "creator" || as === "user" ? `/welcome?as=${as}` : null)

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm next={callbackNext} linkError={firstParam(params.error) === "link"} />
    </main>
  )
}

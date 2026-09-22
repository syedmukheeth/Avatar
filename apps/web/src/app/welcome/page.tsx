import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { RolePicker } from "@/app/welcome/role-picker"
import { homeFor, safeNextPath } from "@/lib/auth/destination"
import { getViewer } from "@/lib/auth/viewer"
import { firstParam } from "@/lib/search-params"

export const metadata: Metadata = { title: "Welcome" }

export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const params = await searchParams
  const next = safeNextPath(firstParam(params.next))

  const viewer = await getViewer()
  if (!viewer) redirect("/login")
  if (viewer.accountType !== null) redirect(next ?? homeFor(viewer))

  const as = firstParam(params.as)
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <RolePicker initial={as === "creator" || as === "user" ? as : null} next={next} />
    </main>
  )
}

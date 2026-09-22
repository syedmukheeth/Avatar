import { LayoutDashboard, MessagesSquare, UserRound } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import { getViewer } from "@/lib/auth/viewer"
import { demoMode } from "@/lib/env"

const NAV = [
  { href: "/studio", label: "Dashboard", icon: LayoutDashboard, demoOnly: false },
  { href: "/studio/conversations", label: "Conversations", icon: MessagesSquare, demoOnly: true },
  { href: "/studio/profile", label: "Creator profile", icon: UserRound, demoOnly: false },
] as const

// Server-side guard for every /studio page: signed in, role chosen, creator account.
export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const viewer = await getViewer()
  if (!viewer) redirect("/login?next=/studio")
  if (viewer.accountType === null) redirect("/welcome?next=/studio")
  if (viewer.accountType !== "creator") redirect("/explore")

  const nav = NAV.filter((item) => demoMode || !item.demoOnly)

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row md:gap-10">
        <aside className="md:w-52 md:shrink-0">
          <nav className="flex gap-1 overflow-x-auto md:sticky md:top-24 md:flex-col">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  )
}

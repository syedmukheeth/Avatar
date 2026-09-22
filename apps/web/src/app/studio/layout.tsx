import Link from "next/link"
import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import { getViewer } from "@/lib/auth/viewer"

const NAV = [
  { href: "/studio", label: "Dashboard" },
  { href: "/studio/profile", label: "Creator profile" },
] as const

// Server-side guard for every /studio page: signed in, role chosen, creator account.
export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const viewer = await getViewer()
  if (!viewer) redirect("/login?next=/studio")
  if (viewer.accountType === null) redirect("/welcome?next=/studio")
  if (viewer.accountType !== "creator") redirect("/explore")

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  )
}

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { homeFor } from "@/lib/auth/destination"
import { getViewer } from "@/lib/auth/viewer"

export async function SiteHeader() {
  const viewer = await getViewer()

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Mind<span className="text-primary">Link</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/explore">Explore</Link>
          </Button>
          {viewer ? (
            <>
              {viewer.accountType === "creator" && (
                <Button asChild variant="ghost">
                  <Link href="/studio">Studio</Link>
                </Button>
              )}
              {viewer.accountType === null && (
                <Button asChild variant="ghost">
                  <Link href={homeFor(viewer)}>Finish setup</Link>
                </Button>
              )}
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}

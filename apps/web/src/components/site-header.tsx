import Link from "next/link"

import { Button } from "@/components/ui/button"
import { homeFor } from "@/lib/auth/destination"
import { getViewer } from "@/lib/auth/viewer"

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 34% 28%, oklch(0.95 0.05 285), oklch(0.62 0.22 278) 55%, oklch(0.4 0.18 290))",
      }}
    />
  )
}

export async function SiteHeader() {
  const viewer = await getViewer()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-xl font-semibold tracking-tight">MindLink</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
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
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/login?as=creator">For creators</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}

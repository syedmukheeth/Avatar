import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-base text-foreground">MindLink</span> · AI characters
          are clearly labelled and answer only from creator-approved knowledge.
        </p>
        <nav className="flex gap-5">
          <Link href="/explore" className="hover:text-foreground">
            Explore
          </Link>
          <Link href="/login?as=creator" className="hover:text-foreground">
            For creators
          </Link>
        </nav>
      </div>
    </footer>
  )
}

import { demoMode } from "@/lib/env"

export function DemoBanner() {
  if (!demoMode) return null
  return (
    <div className="border-b border-primary/15 bg-primary-soft/70 px-4 py-2 text-center text-xs text-accent-foreground backdrop-blur">
      <span className="mr-2 rounded-full bg-primary px-2 py-0.5 font-semibold tracking-wide text-primary-foreground uppercase">
        Demo
      </span>
      Sample creators and a simulated AI that runs in your browser. The live product answers with a
      real model from each creator&apos;s uploaded knowledge, in their cloned voice.
    </div>
  )
}

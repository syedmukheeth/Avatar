import type { Metadata } from "next"

import { CreatorProfileForm } from "@/app/studio/profile/creator-profile-form"
import { SOCIAL_KEYS, type CreatorProfileInput } from "@/lib/creators/profile-schema"
import { getViewer } from "@/lib/auth/viewer"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Creator profile" }

export default async function CreatorProfilePage() {
  const viewer = await getViewer()
  if (!viewer) return null // The studio layout already redirected.

  const supabase = await createClient()
  const { data: creator } = await supabase
    .from("creators")
    .select("display_name, profession, bio, social_links")
    .eq("user_id", viewer.userId)
    .maybeSingle()

  const links = (creator?.social_links ?? {}) as Record<string, unknown>
  const defaults: CreatorProfileInput = {
    displayName: creator?.display_name ?? "",
    profession: creator?.profession ?? "",
    bio: creator?.bio ?? "",
    social: Object.fromEntries(
      SOCIAL_KEYS.map((key) => [key, typeof links[key] === "string" ? links[key] : ""]),
    ) as CreatorProfileInput["social"],
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Creator profile</h1>
      <p className="mt-2 text-muted-foreground">
        This is the real person behind your characters. Audiences see it on every character page.
      </p>
      <CreatorProfileForm userId={viewer.userId} exists={creator !== null} defaults={defaults} />
    </div>
  )
}

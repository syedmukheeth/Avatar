import type { Metadata } from "next"

import { CreatorProfileForm } from "@/app/studio/profile/creator-profile-form"
import { getViewer } from "@/lib/auth/viewer"
import { SOCIAL_KEYS, type CreatorProfileInput } from "@/lib/creators/profile-schema"
import { DEMO_CREATOR } from "@/lib/demo/session"
import { demoMode } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Creator profile" }

const EMPTY_SOCIAL = Object.fromEntries(
  SOCIAL_KEYS.map((key) => [key, ""]),
) as CreatorProfileInput["social"]

async function loadDefaults(
  userId: string,
): Promise<{ defaults: CreatorProfileInput; exists: boolean }> {
  if (demoMode) {
    return {
      exists: true,
      defaults: {
        displayName: DEMO_CREATOR.displayName,
        profession: DEMO_CREATOR.profession,
        bio: DEMO_CREATOR.bio,
        social: {
          ...EMPTY_SOCIAL,
          website: "https://mayarao.example",
          instagram: "https://instagram.com/mayarao.example",
        },
      },
    }
  }

  const supabase = await createClient()
  const { data: creator } = await supabase
    .from("creators")
    .select("display_name, profession, bio, social_links")
    .eq("user_id", userId)
    .maybeSingle()
  const links = (creator?.social_links ?? {}) as Record<string, unknown>
  return {
    exists: creator !== null,
    defaults: {
      displayName: creator?.display_name ?? "",
      profession: creator?.profession ?? "",
      bio: creator?.bio ?? "",
      social: Object.fromEntries(
        SOCIAL_KEYS.map((key) => [key, typeof links[key] === "string" ? links[key] : ""]),
      ) as CreatorProfileInput["social"],
    },
  }
}

export default async function CreatorProfilePage() {
  const viewer = await getViewer()
  if (!viewer) return null // The studio layout already redirected.
  const { defaults, exists } = await loadDefaults(viewer.userId)

  return (
    <div className="max-w-2xl animate-rise">
      <h1 className="text-4xl font-medium">Creator profile</h1>
      <p className="mt-2 text-muted-foreground">
        This is the real person behind your characters. Audiences see it on every character page.
      </p>
      <CreatorProfileForm
        userId={viewer.userId}
        exists={exists}
        defaults={defaults}
        demo={demoMode}
      />
    </div>
  )
}

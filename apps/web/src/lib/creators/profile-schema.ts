import { z } from "zod"

export const SOCIAL_KEYS = ["website", "instagram", "youtube", "linkedin", "x"] as const
export type SocialKey = (typeof SOCIAL_KEYS)[number]

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "Use a full https:// link")

// Mirrors the column checks on public.creators.
export const creatorProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Required").max(80),
  profession: z.string().trim().max(120),
  bio: z.string().trim().max(2000),
  social: z.object(
    Object.fromEntries(SOCIAL_KEYS.map((key) => [key, optionalUrl])) as {
      [K in SocialKey]: typeof optionalUrl
    },
  ),
})

export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>

/** Drops empty links so the stored object only contains real URLs. */
export function toSocialLinks(social: CreatorProfileInput["social"]): Record<string, string> {
  return Object.fromEntries(Object.entries(social).filter(([, url]) => url !== ""))
}

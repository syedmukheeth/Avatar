"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  creatorProfileSchema,
  SOCIAL_KEYS,
  toSocialLinks,
  type CreatorProfileInput,
} from "@/lib/creators/profile-schema"
import { createClient } from "@/lib/supabase/client"

const SOCIAL_LABELS = {
  website: "Website",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
} as const

type Props = {
  userId: string
  exists: boolean
  defaults: CreatorProfileInput
  /** Demo mode validates the form but saves nothing. */
  demo?: boolean
}

export function CreatorProfileForm({ userId, exists, defaults, demo = false }: Props) {
  const router = useRouter()
  const form = useForm<CreatorProfileInput>({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: defaults,
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: CreatorProfileInput) {
    if (demo) {
      toast.success("Profile saved (demo: nothing leaves your browser)")
      router.push("/studio")
      return
    }
    const fields = {
      display_name: values.displayName,
      profession: values.profession || null,
      bio: values.bio || null,
      social_links: toSocialLinks(values.social),
    }
    const supabase = createClient()
    const { error } = exists
      ? await supabase.from("creators").update(fields).eq("user_id", userId)
      : await supabase.from("creators").insert({ user_id: userId, ...fields })
    if (error) {
      toast.error("Could not save your profile. Please try again.")
      return
    }
    toast.success("Profile saved")
    router.push("/studio")
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5" noValidate>
      <Field label="Display name" id="displayName" error={errors.displayName?.message}>
        <Input id="displayName" {...form.register("displayName")} />
      </Field>
      <Field label="Profession" id="profession" error={errors.profession?.message}>
        <Input
          id="profession"
          placeholder="Fitness coach, founder, educator…"
          {...form.register("profession")}
        />
      </Field>
      <Field label="Bio" id="bio" error={errors.bio?.message}>
        <Textarea id="bio" rows={5} {...form.register("bio")} />
      </Field>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">Links</legend>
        {SOCIAL_KEYS.map((key) => (
          <Field
            key={key}
            label={SOCIAL_LABELS[key]}
            id={key}
            error={errors.social?.[key]?.message}
          >
            <Input
              id={key}
              inputMode="url"
              placeholder="https://"
              {...form.register(`social.${key}`)}
            />
          </Field>
        ))}
      </fieldset>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {exists ? "Save profile" : "Create profile"}
      </Button>
    </form>
  )
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

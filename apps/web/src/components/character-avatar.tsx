import { cn } from "@/lib/utils"

type Props = {
  name: string
  hue: number
  size?: number
  className?: string
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** Generated portrait: a lit sphere in the character's hue with the creator's initials. */
export function CharacterAvatar({ name, hue, size = 56, className }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full font-display font-medium text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `radial-gradient(circle at 32% 28%, oklch(0.93 0.07 ${hue}), oklch(0.68 0.16 ${hue}) 52%, oklch(0.42 0.13 ${hue + 18}))`,
        boxShadow: `inset 0 -${size * 0.06}px ${size * 0.14}px oklch(0.3 0.1 ${hue} / 0.45), 0 ${size * 0.08}px ${size * 0.3}px -${size * 0.08}px oklch(0.5 0.15 ${hue} / 0.5)`,
        textShadow: "0 1px 2px oklch(0.2 0.05 270 / 0.35)",
      }}
    >
      {initials(name)}
    </div>
  )
}

import { cn } from "@/lib/utils"

export type OrbState = "idle" | "connecting" | "listening" | "thinking" | "speaking"

type Props = {
  hue: number
  state?: OrbState
  size?: number
  className?: string
}

/** The character's presence: breathes while listening, swirls while thinking, ripples while speaking. */
export function VoiceOrb({ hue, state = "idle", size = 200, className }: Props) {
  const swirlSeconds = state === "thinking" || state === "connecting" ? 1.6 : 12
  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute -inset-[18%] rounded-full opacity-70 blur-3xl"
        style={{
          background: `radial-gradient(circle, oklch(0.78 0.14 ${hue} / 0.7), transparent 65%)`,
        }}
      />
      {state === "speaking" &&
        [0, 1, 2].map((ring) => (
          <span
            key={ring}
            className="absolute inset-0 animate-ripple rounded-full border-2"
            style={{
              borderColor: `oklch(0.7 0.15 ${hue} / 0.55)`,
              animationDelay: `${ring * 0.53}s`,
            }}
          />
        ))}
      <div
        className={cn(
          "relative size-full overflow-hidden rounded-full transition-transform duration-700",
          (state === "idle" || state === "listening") && "animate-breathe",
          state === "speaking" && "scale-105",
        )}
        style={{
          animationDuration: state === "listening" ? "2.6s" : undefined,
          background: `radial-gradient(circle at 34% 28%, oklch(0.96 0.05 ${hue}), oklch(0.74 0.16 ${hue}) 45%, oklch(0.46 0.16 ${hue + 25}) 80%)`,
          boxShadow: `inset 0 -${size * 0.08}px ${size * 0.2}px oklch(0.3 0.12 ${hue + 20} / 0.5), inset 0 ${size * 0.04}px ${size * 0.08}px oklch(1 0 0 / 0.5)`,
        }}
      >
        <div
          className="absolute -inset-1/4 animate-orbit mix-blend-soft-light"
          style={{
            animationDuration: `${swirlSeconds}s`,
            background:
              "conic-gradient(from 0deg, transparent 0 55%, oklch(1 0 0 / 0.75) 70%, transparent 85%)",
          }}
        />
      </div>
    </div>
  )
}

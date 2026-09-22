// Picks a distinct built-in browser voice per character in demo mode. Available voices differ by
// OS and browser, so this scores what exists instead of hard-coding names.

export type VoiceHint = {
  lang: string
  gender: "female" | "male"
  pitch: number
  rate: number
}

type VoiceLike = Pick<SpeechSynthesisVoice, "name" | "lang">

const FEMALE =
  /female|woman|zira|heera|neerja|swara|kalpana|samantha|victoria|karen|moira|tessa|susan|hazel|libby|sonia|aria|jenny|emma|ava|allison|serena|fiona/i
const MALE =
  /\bmale\b|\bman\b|david|ravi|prabhat|hemant|daniel|alex|fred|george|guy|ryan|mark|james|thomas|oliver|aaron|rishi/i
const PREMIUM = /natural|neural|online|google|enhanced|premium/i

function genderOf(voice: VoiceLike): "female" | "male" | null {
  // Test female first: "female" contains "male".
  if (FEMALE.test(voice.name)) return "female"
  if (MALE.test(voice.name)) return "male"
  return null
}

export function pickVoice<V extends VoiceLike>(voices: V[], hint: VoiceHint): V | null {
  let best: V | null = null
  let bestScore = -1
  for (const voice of voices) {
    const lang = voice.lang.replace("_", "-").toLowerCase()
    if (!lang.startsWith("en")) continue
    let score = 0
    if (lang === hint.lang.toLowerCase()) score += 4
    const gender = genderOf(voice)
    if (gender === hint.gender) score += 3
    else if (gender !== null) score -= 2
    if (PREMIUM.test(voice.name)) score += 1
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  return best
}

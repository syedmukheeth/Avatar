"use client"

import { Hand, Mic, Phone, PhoneOff, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import type { ChatCharacter } from "@/components/chat/chat-panel"
import { Button } from "@/components/ui/button"
import { VoiceOrb, type OrbState } from "@/components/voice-orb"
import { answer } from "@/lib/demo/engine"
import { pickVoice } from "@/lib/demo/voices"
import { cn } from "@/lib/utils"

// Minimal Web Speech API surface; not every browser ships these types or the API itself.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

type CallState = "idle" | "ended" | Exclude<OrbState, "idle">
type Line = { id: string; who: "you" | "ai"; text: string }

const MAX_CALL_SECS = 300
const STATUS: Record<CallState, string> = {
  idle: "Ready when you are",
  connecting: "Connecting…",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  ended: "Call ended",
}

/** Voice answers stay short, like the real voice mode: first paragraph, two sentences. */
function toSpoken(text: string): string {
  const first = text.split("\n\n")[0] ?? text
  const sentences = first.match(/[^.!?]+[.!?]+/g) ?? [first]
  return sentences.slice(0, 2).join(" ").trim()
}

function formatClock(totalSecs: number): string {
  const minutes = Math.floor(totalSecs / 60)
  const seconds = totalSecs % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// Rendered client-only (see voice-call-client.tsx). Handlers below are plain functions: browser
// callbacks read live state through refs, so a stale closure can never act on an ended call.
export function VoiceCall({ character }: { character: ChatCharacter }) {
  const [state, setState] = useState<CallState>("idle")
  const [lines, setLines] = useState<Line[]>([])
  const [interim, setInterim] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [typed, setTyped] = useState("")
  const [micError, setMicError] = useState<string | null>(null)
  const [canListen, setCanListen] = useState(() => recognitionCtor() !== null)

  const stateRef = useRef<CallState>("idle")
  const recognitionRef = useRef<Recognition | null>(null)
  const timersRef = useRef<number[]>([])

  const active = state !== "idle" && state !== "ended"

  useEffect(() => {
    // Chrome loads voices lazily; asking early makes the first answer sound right.
    window.speechSynthesis?.getVoices()
  }, [])

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setElapsed((secs) => secs + 1), 1000)
    return () => window.clearInterval(id)
  }, [active])

  useEffect(() => {
    const timers = timersRef
    const recognition = recognitionRef
    return () => {
      recognition.current?.abort()
      window.speechSynthesis?.cancel()
      timers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  function go(next: CallState) {
    stateRef.current = next
    setState(next)
  }

  function later(fn: () => void, ms: number) {
    timersRef.current.push(window.setTimeout(fn, ms))
  }

  function stopListening() {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) {
      recognition.onend = null
      recognition.abort()
    }
    setInterim("")
  }

  function endCall() {
    stopListening()
    window.speechSynthesis?.cancel()
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    go("ended")
  }

  function listen() {
    go("listening")
    const Ctor = recognitionCtor()
    if (!Ctor) return // The typed fallback is shown instead.
    const recognition = new Ctor()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let finalText = ""
      let partial = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else partial += result[0].transcript
      }
      setInterim(partial)
      if (finalText.trim()) {
        stopListening()
        respond(finalText.trim())
      }
    }
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMicError("Microphone access was blocked. Allow it in your browser, or type below.")
        setCanListen(false)
      }
    }
    recognition.onend = () => {
      // Silence ends a recognition session; keep listening while the call is live.
      if (stateRef.current === "listening" && recognitionRef.current === recognition) {
        recognition.start()
      }
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  function speak(text: string) {
    const synth = window.speechSynthesis
    if (!synth) {
      later(listen, 2500)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    const hint = character.voice ?? { lang: "en-US", gender: "female", pitch: 1, rate: 1 }
    utterance.voice = pickVoice(synth.getVoices(), hint)
    utterance.lang = utterance.voice?.lang ?? hint.lang
    utterance.pitch = hint.pitch
    utterance.rate = hint.rate
    utterance.onstart = () => go("speaking")
    utterance.onend = () => {
      if (stateRef.current === "speaking") listen()
    }
    synth.cancel()
    synth.speak(utterance)
  }

  function respond(question: string) {
    setLines((current) => [...current, { id: crypto.randomUUID(), who: "you", text: question }])
    go("thinking")
    later(() => {
      if (stateRef.current !== "thinking") return
      const spoken = toSpoken(answer(question, character).text)
      setLines((current) => [...current, { id: crypto.randomUUID(), who: "ai", text: spoken }])
      speak(spoken)
    }, 650)
  }

  function startCall() {
    setLines([])
    setElapsed(0)
    setMicError(null)
    go("connecting")
    later(endCall, MAX_CALL_SECS * 1000)
    later(() => {
      const greeting = toSpoken(character.greeting)
      setLines([{ id: crypto.randomUUID(), who: "ai", text: greeting }])
      speak(greeting)
    }, 900)
  }

  function interrupt() {
    window.speechSynthesis?.cancel()
    listen()
  }

  function submitTyped(event: React.FormEvent) {
    event.preventDefault()
    const question = typed.trim()
    if (!question || state !== "listening") return
    setTyped("")
    stopListening()
    respond(question)
  }

  const orbState: OrbState = state === "ended" ? "idle" : state

  return (
    <div className="flex flex-1 flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-6">
        <VoiceOrb hue={character.hue} state={orbState} size={220} />
        <div className="text-center">
          <h1 className="text-3xl font-semibold">{character.name}</h1>
          <p className="text-sm text-muted-foreground">
            AI representation of {character.creatorName}
          </p>
          <p
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
              active ? "bg-primary-soft text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
            aria-live="polite"
          >
            {active && <span className="size-2 animate-blink rounded-full bg-primary" />}
            {STATUS[state]}
            {(active || state === "ended") && (
              <span className="tabular-nums opacity-70">· {formatClock(elapsed)}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!active ? (
          <Button size="lg" className="h-14 rounded-full px-8 text-base" onClick={startCall}>
            <Phone /> {state === "ended" ? "Call again" : `Call ${character.name}`}
          </Button>
        ) : (
          <>
            {state === "speaking" && (
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full px-6"
                onClick={interrupt}
              >
                <Hand /> Interrupt
              </Button>
            )}
            <Button
              size="lg"
              variant="destructive"
              className="h-14 rounded-full px-6"
              onClick={endCall}
            >
              <PhoneOff /> End
            </Button>
          </>
        )}
      </div>

      {active && state === "listening" && (
        <div className="w-full max-w-lg">
          {canListen ? (
            <p className="flex min-h-6 items-center justify-center gap-2 text-center text-muted-foreground">
              <Mic className="size-4 text-primary" aria-hidden />
              {interim || "Go ahead, ask a question out loud."}
            </p>
          ) : (
            <form onSubmit={submitTyped} className="flex gap-2">
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder="Your browser can't listen here. Type your question."
                aria-label="Type your question"
                className="h-11 flex-1 rounded-full border bg-card px-4 outline-none focus:border-primary/50"
              />
              <Button type="submit" size="icon" className="size-11 rounded-full" aria-label="Send">
                <Send />
              </Button>
            </form>
          )}
          {micError && <p className="mt-2 text-center text-sm text-destructive">{micError}</p>}
        </div>
      )}

      {lines.length > 0 && (
        <ol className="flex w-full max-w-lg flex-col gap-3 rounded-2xl border bg-card/80 p-4 backdrop-blur">
          {lines.slice(-6).map((line) => (
            <li key={line.id} className="animate-rise text-sm">
              <span
                className={cn(
                  "mr-2 text-xs font-semibold tracking-wide uppercase",
                  line.who === "ai" ? "text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {line.who === "ai" ? character.name : "You"}
              </span>
              {line.text}
            </li>
          ))}
        </ol>
      )}

      <p className="max-w-md text-center text-xs text-muted-foreground">
        Demo voice uses your browser&apos;s built-in speech. The live product streams the
        creator&apos;s cloned voice over WebRTC, and you can interrupt just by talking.
      </p>
    </div>
  )
}

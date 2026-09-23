"use client"

import { AudioLines, CheckCircle2, Loader2, Mic, Square, Volume2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { updateCharacter, type StudioCharacter } from "@/lib/demo/studio-store"
import { pickVoice } from "@/lib/demo/voices"

const MAX_SECS = 60
const MIN_SECS = 10
const SCRIPT =
  "Hi, I'm recording this so my AI can speak in my voice. I'll read at my normal pace, the way I'd explain something to a friend. Consistency beats intensity, and small steps add up faster than you think."

type Recording = { url: string; seconds: number }

export function EditorVoice({ character }: { character: StudioCharacter }) {
  const [consent, setConsent] = useState(false)
  const [recordingSecs, setRecordingSecs] = useState<number | null>(null)
  const [level, setLevel] = useState(0)
  const [take, setTake] = useState<Recording | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const takeUrl = useRef<string | null>(null)

  useEffect(
    () => () => {
      stopRef.current?.()
      if (takeUrl.current) URL.revokeObjectURL(takeUrl.current)
    },
    [],
  )

  async function startRecording() {
    setError(null)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError("Microphone access was blocked. Allow it in your browser to record.")
      return
    }

    const audio = new AudioContext()
    const analyser = audio.createAnalyser()
    analyser.fftSize = 512
    audio.createMediaStreamSource(stream).connect(analyser)
    const samples = new Uint8Array(analyser.fftSize)

    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []
    const startedAt = performance.now()
    let frame = 0

    const meter = () => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (const sample of samples) sum += ((sample - 128) / 128) ** 2
      setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 4))
      const secs = Math.floor((performance.now() - startedAt) / 1000)
      setRecordingSecs(secs)
      if (secs >= MAX_SECS) stop()
      else frame = requestAnimationFrame(meter)
    }

    recorder.ondataavailable = (event) => chunks.push(event.data)
    recorder.onstop = () => {
      const seconds = Math.round((performance.now() - startedAt) / 1000)
      if (takeUrl.current) URL.revokeObjectURL(takeUrl.current)
      const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }))
      takeUrl.current = url
      setTake({ url, seconds })
    }

    const stop = () => {
      cancelAnimationFrame(frame)
      if (recorder.state !== "inactive") recorder.stop()
      stream.getTracks().forEach((track) => track.stop())
      void audio.close()
      stopRef.current = null
      setRecordingSecs(null)
      setLevel(0)
    }

    stopRef.current = stop
    recorder.start()
    frame = requestAnimationFrame(meter)
  }

  function createVoice() {
    updateCharacter(character.id, { voice: "processing" })
    window.setTimeout(() => updateCharacter(character.id, { voice: "ready" }), 2800)
    setConsent(false)
    setTake(null)
  }

  function playPreview() {
    const synth = window.speechSynthesis
    if (!synth) return
    const line = `Hi, I'm ${character.name}. ${character.tagline || "Ask me anything from my knowledge."}`
    const utterance = new SpeechSynthesisUtterance(line)
    // The demo creator (Maya) gets the same browser voice as her public character.
    utterance.voice = pickVoice(synth.getVoices(), {
      lang: "en-IN",
      gender: "female",
      pitch: 1.05,
      rate: 1,
    })
    utterance.pitch = 1.05
    synth.cancel()
    synth.speak(utterance)
  }

  const recording = recordingSecs !== null
  const canClone = consent && take !== null && take.seconds >= MIN_SECS && !recording

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium">Voice</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Record up to a minute of clear speech. Your AI will answer calls in your voice.
        </p>
      </div>

      {character.voice === "ready" && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-success/30 bg-success/5 p-4">
          <CheckCircle2 className="size-5 text-success" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">Your cloned voice is ready</p>
            <p className="text-sm text-muted-foreground">
              Calls with {character.name} use it. Record again below to replace it.
            </p>
          </div>
          <Button variant="outline" onClick={playPreview}>
            <Volume2 /> Play sample
          </Button>
        </div>
      )}

      {character.voice === "processing" ? (
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-6">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
          <p>Creating your private voice clone…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5">
          <div>
            <p className="text-sm font-medium">Read this aloud</p>
            <blockquote className="mt-2 border-l-2 border-primary/40 pl-4 font-display text-lg leading-relaxed">
              {SCRIPT}
            </blockquote>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {recording ? (
              <Button variant="destructive" onClick={() => stopRef.current?.()}>
                <Square /> Stop · {recordingSecs}s
              </Button>
            ) : (
              <Button variant="outline" onClick={startRecording}>
                <Mic /> {take ? "Record again" : "Start recording"}
              </Button>
            )}
            <div className="flex h-8 flex-1 items-center gap-0.5" aria-hidden title="Input level">
              {Array.from({ length: 32 }, (_, bar) => (
                <span
                  key={bar}
                  className="w-1.5 rounded-full bg-primary/70 transition-[height] duration-75"
                  style={{
                    height: `${Math.max(8, level * 100 * (0.45 + 0.55 * Math.abs(Math.sin(bar * 1.7))))}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {take && !recording && (
            <div className="flex flex-col gap-2">
              <audio controls src={take.url} className="w-full" />
              {take.seconds < MIN_SECS && (
                <p className="text-sm text-destructive">
                  That take is {take.seconds}s. Record at least {MIN_SECS}s for a good clone.
                </p>
              )}
            </div>
          )}

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span>
              This is my own voice, and I consent to MindLink creating an AI clone of it for my
              characters. I can delete it at any time.
            </span>
          </label>

          <Button onClick={createVoice} disabled={!canClone} className="self-start">
            <AudioLines /> {character.voice === "ready" ? "Replace voice" : "Create voice clone"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Your recording stays in this browser. Cloning a character voice from your own audio is
        coming soon; calls currently use a studio voice.
      </p>
    </div>
  )
}

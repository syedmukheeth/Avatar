"use client"

import { ArrowUp, FileText, RotateCcw, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { CharacterAvatar } from "@/components/character-avatar"
import { Button } from "@/components/ui/button"
import type { KnowledgeSnippet } from "@/lib/demo/characters"
import { answer, type AnswerKind } from "@/lib/demo/engine"
import type { VoiceHint } from "@/lib/demo/voices"
import { cn } from "@/lib/utils"

export type ChatCharacter = {
  name: string
  creatorName: string
  hue: number
  topics: string[]
  greeting: string
  suggested: string[]
  knowledge: KnowledgeSnippet[]
  voice?: VoiceHint
}

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; kind: AnswerKind; sources: string[] }

type Props = {
  character: ChatCharacter
  /** localStorage key for history; null keeps the conversation in memory only. */
  storageKey: string | null
  initialQuestion?: string
  compact?: boolean
}

function loadHistory(key: string | null): Message[] {
  if (!key) return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Message[]) : []
  } catch {
    return []
  }
}

function saveHistory(key: string | null, messages: Message[]) {
  if (!key) return
  try {
    window.localStorage.setItem(key, JSON.stringify(messages.slice(-40)))
  } catch {
    // Storage can be full or blocked (private mode); history is a convenience only.
  }
}

export function ChatPanel({ character, storageKey, initialQuestion, compact = false }: Props) {
  // Rendered client-only (see chat-panel-client.tsx), so reading storage here is safe.
  const [messages, setMessages] = useState<Message[]>(() => loadHistory(storageKey))
  const [draft, setDraft] = useState("")
  const [phase, setPhase] = useState<"idle" | "thinking" | "streaming">("idle")
  const [streamed, setStreamed] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const askedInitial = useRef(false)

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, streamed, phase])

  const send = useCallback(
    (raw: string) => {
      const question = raw.trim()
      if (!question || phase !== "idle") return
      const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: question }
      setMessages((current) => [...current, userMessage])
      setDraft("")
      setPhase("thinking")

      const result = answer(question, character)
      const words = result.text.split(" ")
      const thinkMs = 450 + Math.min(600, question.length * 8)

      timers.current.push(
        window.setTimeout(() => {
          setPhase("streaming")
          let shown = 0
          const tick = () => {
            shown = Math.min(words.length, shown + 3)
            setStreamed(words.slice(0, shown).join(" "))
            if (shown < words.length) {
              timers.current.push(window.setTimeout(tick, 28))
              return
            }
            setMessages((current) => {
              const next: Message[] = [
                ...current,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  text: result.text,
                  kind: result.kind,
                  sources: result.sources,
                },
              ]
              saveHistory(storageKey, next)
              return next
            })
            setStreamed("")
            setPhase("idle")
          }
          tick()
        }, thinkMs),
      )
    },
    [character, phase, storageKey],
  )

  useEffect(() => {
    if (initialQuestion && !askedInitial.current) {
      askedInitial.current = true
      send(initialQuestion)
    }
  }, [initialQuestion, send])

  function reset() {
    setMessages([])
    saveHistory(storageKey, [])
  }

  const empty = messages.length === 0 && phase === "idle"

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", compact ? "text-sm" : "")}>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {empty && (
            <div className="flex animate-rise flex-col items-center gap-4 py-8 text-center">
              <CharacterAvatar
                name={character.creatorName}
                hue={character.hue}
                size={compact ? 48 : 64}
              />
              <p className="max-w-md text-muted-foreground">{character.greeting}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {character.suggested.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => send(question)}
                    className="rounded-full border bg-card px-3.5 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary-soft/60"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 whitespace-pre-wrap text-primary-foreground">
                  {message.text}
                </p>
              </div>
            ) : (
              <AssistantBubble key={message.id} character={character} message={message} />
            ),
          )}

          {phase === "thinking" && (
            <div className="flex items-center gap-3" aria-live="polite">
              <CharacterAvatar name={character.creatorName} hue={character.hue} size={28} />
              <div className="flex gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-1.5 animate-blink rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${dot * 0.18}s` }}
                  />
                ))}
                <span className="sr-only">Searching approved knowledge</span>
              </div>
            </div>
          )}

          {phase === "streaming" && (
            <div className="flex items-start gap-3">
              <CharacterAvatar name={character.creatorName} hue={character.hue} size={28} />
              <p className="max-w-[85%] rounded-2xl rounded-bl-md border bg-card px-4 py-2.5 whitespace-pre-wrap">
                {streamed}
                <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-blink bg-primary" />
              </p>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          send(draft)
        }}
        className="mx-auto w-full max-w-2xl pt-2"
      >
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-[0_10px_30px_-18px_oklch(0.4_0.1_278/0.35)] focus-within:border-primary/50">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                send(draft)
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder={`Ask ${character.name}…`}
            aria-label={`Message ${character.name}`}
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 outline-none placeholder:text-muted-foreground"
          />
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={reset}
              disabled={phase !== "idle"}
              aria-label="New chat"
              title="New chat"
            >
              <RotateCcw />
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || phase !== "idle"}
            aria-label="Send"
          >
            <ArrowUp />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI representation of {character.creatorName}. Answers come only from knowledge they
          approved.
        </p>
      </form>
    </div>
  )
}

function AssistantBubble({
  character,
  message,
}: {
  character: ChatCharacter
  message: Extract<Message, { role: "assistant" }>
}) {
  const heldBack = message.kind === "refusal" || message.kind === "guard"
  return (
    <div className="flex animate-rise items-start gap-3">
      <CharacterAvatar name={character.creatorName} hue={character.hue} size={28} />
      <div className="flex max-w-[85%] flex-col gap-2">
        <div
          className={cn(
            "rounded-2xl rounded-bl-md border px-4 py-2.5",
            heldBack ? "border-dashed bg-muted/60" : "bg-card",
          )}
        >
          {message.text.split("\n\n").map((paragraph, index) => (
            <p key={index} className={index > 0 ? "mt-2.5" : undefined}>
              {paragraph}
            </p>
          ))}
        </div>
        {message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs text-accent-foreground"
              >
                <FileText className="size-3" aria-hidden />
                {source}
              </span>
            ))}
          </div>
        )}
        {heldBack && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" aria-hidden />
            Stayed within approved knowledge
          </span>
        )}
      </div>
    </div>
  )
}

"use client"

import { FileText, Loader2, NotebookPen, Trash2, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  toSnippets,
  updateCharacter,
  updateKnowledge,
  type StudioCharacter,
  type StudioKnowledge,
} from "@/lib/demo/studio-store"

const MAX_FILE_BYTES = 10 * 1024 * 1024

/** Mimics the ingestion worker: queued → processing → ready. */
function simulateProcessing(characterId: string, item: StudioKnowledge) {
  window.setTimeout(() => updateKnowledge(characterId, item.id, { status: "processing" }), 600)
  window.setTimeout(() => updateKnowledge(characterId, item.id, { status: "ready" }), 2200)
}

export function EditorKnowledge({ character }: { character: StudioCharacter }) {
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)

  function add(item: Omit<StudioKnowledge, "id" | "status">) {
    const created: StudioKnowledge = { ...item, id: crypto.randomUUID(), status: "queued" }
    updateCharacter(character.id, (current) => ({ knowledge: [...current.knowledge, created] }))
    simulateProcessing(character.id, created)
  }

  function addNote(event: React.FormEvent) {
    event.preventDefault()
    const noteTitle = title.trim() || "Untitled note"
    const snippets = toSnippets(text, noteTitle)
    if (snippets.length === 0) return
    add({ title: noteTitle, type: "note", chunks: snippets.length, snippets })
    setTitle("")
    setText("")
  }

  async function addFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Files can be up to 10 MB.")
      return
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    const isText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")
    if (!isPdf && !isText) {
      toast.error("Upload a PDF or a .txt file.")
      return
    }
    if (isText) {
      const snippets = toSnippets(await file.text(), file.name)
      add({ title: file.name, type: "text", chunks: snippets.length, snippets })
      return
    }
    add({
      title: file.name,
      type: "pdf",
      chunks: Math.max(1, Math.round(file.size / 4000)),
      snippets: [],
      simulated: true,
    })
  }

  function remove(id: string) {
    updateCharacter(character.id, (current) => ({
      knowledge: current.knowledge.filter((item) => item.id !== id),
    }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium">Approved knowledge</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your AI answers only from what you add here. Everything else gets a polite “I don&apos;t
          know”.
        </p>
      </div>

      {character.knowledge.length > 0 ? (
        <ul className="divide-y rounded-2xl border bg-card">
          {character.knowledge.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              {item.type === "note" ? (
                <NotebookPen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.status === "ready"
                    ? `${item.chunks} chunk${item.chunks === 1 ? "" : "s"} embedded`
                    : item.status === "processing"
                      ? "Extracting, chunking and embedding…"
                      : "Queued"}
                  {item.simulated && item.status === "ready" && " · simulated in demo"}
                </p>
              </div>
              {item.status === "ready" ? (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  Ready
                </span>
              ) : (
                <Loader2 className="size-4 animate-spin text-primary" aria-label="Processing" />
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${item.title}`}
                onClick={() => remove(item.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No knowledge yet. Add a note or upload a file to get started.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <form onSubmit={addNote} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-title">Add a note</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. My take on rest days"
              maxLength={200}
            />
          </div>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            placeholder="Write it the way you'd answer a follow-up question."
            aria-label="Note text"
            maxLength={50000}
          />
          <Button type="submit" disabled={!text.trim()} className="self-start">
            Add note
          </Button>
        </form>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/60 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:w-56"
        >
          <Upload className="size-5" aria-hidden />
          Upload PDF or TXT
          <span className="text-xs">Up to 10 MB</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,text/plain,.pdf,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void addFile(file)
            event.target.value = ""
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Demo: text files and notes become answerable right away in the test chat. PDFs are simulated
        here; the live product extracts their text on the server.
      </p>
    </div>
  )
}

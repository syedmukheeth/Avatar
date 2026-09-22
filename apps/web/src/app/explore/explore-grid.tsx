"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { CharacterCard } from "@/components/character-card"
import type { DemoCharacter } from "@/lib/demo/characters"

export function ExploreGrid({ characters }: { characters: DemoCharacter[] }) {
  const [query, setQuery] = useState("")

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return characters
    return characters.filter((character) =>
      [
        character.name,
        character.creatorName,
        character.profession,
        character.tagline,
        ...character.topics,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
  }, [characters, query])

  return (
    <>
      <label className="relative mt-8 block max-w-md">
        <span className="sr-only">Search characters</span>
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, topic or profession"
          className="h-12 w-full rounded-full border bg-card pr-4 pl-11 outline-none focus:border-primary/50"
        />
      </label>
      {visible.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-muted-foreground">No characters match “{query}” yet.</p>
      )}
    </>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchTracks } from "@/lib/api"
import { Track } from "@/lib/types"
import { usePlayer } from "@/contexts/player-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<Track[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showResults, setShowResults] = React.useState(false)
  const { playTrack } = usePlayer()
  const searchRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true)
        try {
          const tracks = await searchTracks(query)
          // Cast TrackResponse to Track since they are compatible enough for this use case
          setResults(tracks as unknown as Track[])
          setShowResults(true)
        } catch (error) {
          console.error("Search failed:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handlePlay = (track: Track) => {
    const index = results.findIndex(t => t.id === track.id)
    const newQueue = index !== -1 ? results.slice(index + 1) : []
    playTrack(track, newQueue)
    setShowResults(false)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setShowResults(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for songs, artists, albums..."
          className="pl-9 bg-input border-border placeholder:text-muted-foreground focus-visible:ring-ring rounded-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
        />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((track) => (
                    <button
                      key={track.id}
                      className="w-full flex items-center gap-3 p-2 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                      onClick={() => handlePlay(track)}
                    >
                      <Avatar className="h-10 w-10 rounded-md">
                        <AvatarImage src={track.cover_image_url} alt={track.title} />
                        <AvatarFallback className="rounded-md">
                          {track.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {track.artist_name || "Unknown Artist"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

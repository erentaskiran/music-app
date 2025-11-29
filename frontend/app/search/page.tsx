"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { searchTracks } from "@/lib/api"
import { Track } from "@/lib/types"
import { usePlayer } from "@/contexts/player-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, Heart, MoreHorizontal, ListPlus, PlayCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")
  const [results, setResults] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { playTrack, currentTrack, isPlaying, togglePlay, addToQueue, playNext } = usePlayer()

  useEffect(() => {
    const fetchResults = async () => {
      if (query) {
        setIsLoading(true)
        try {
          const tracks = await searchTracks(query)
          setResults(tracks as unknown as Track[])
        } catch (error) {
          console.error("Search failed:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
      }
    }

    fetchResults()
  }, [query])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar className="hidden lg:flex w-64 shrink-0 fixed left-0 top-0 bottom-24 z-40" />

      <div className="flex-1 lg:ml-64">
        <Navbar />

        <main className="px-4 py-6 md:px-8 pb-32">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Search Results</h1>
            <p className="text-muted-foreground mt-1">
              {query ? `Showing results for "${query}"` : "Enter a search term"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((track, index) => (
                <div
                  key={track.id}
                  className="group flex items-center gap-4 p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="w-8 text-center text-muted-foreground group-hover:hidden">
                    {index + 1}
                  </div>
                  <div className="w-8 hidden group-hover:flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (currentTrack?.id === track.id) {
                          togglePlay()
                        } else {
                          // Play this track and queue the rest of the results
                          playTrack(track, results.slice(index + 1))
                        }
                      }}
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="h-4 w-4 text-primary fill-primary" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={track.cover_image_url} alt={track.title} />
                    <AvatarFallback>{track.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${currentTrack?.id === track.id ? "text-primary" : ""}`}>
                      {track.title}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {track.artist_name}
                    </div>
                  </div>

                  <div className="hidden md:block text-sm text-muted-foreground w-1/4 truncate">
                    {track.genre || "Unknown Genre"}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Heart className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          playNext(track)
                          toast.success("Added to play next")
                        }}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Play Next
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          addToQueue(track)
                          toast.success("Added to queue")
                        }}>
                          <ListPlus className="mr-2 h-4 w-4" />
                          Add to Queue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="text-sm text-muted-foreground w-12 text-right">
                      {formatDuration(track.duration)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {query ? `No tracks found matching "${query}"` : "Start searching to see results"}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SearchResults />
    </Suspense>
  )
}

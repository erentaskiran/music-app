"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { searchTracks, searchUsers, makeRequest, ProfileResponse, likeTrack, unlikeTrack } from "@/lib/api"
import { Track, Album } from "@/lib/types"
import { usePlayer } from "@/contexts/player-context"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Play, Pause, Heart, MoreHorizontal, ListPlus, PlayCircle, Disc, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { AlbumCard } from "@/components/album-card"
import { ArtistCard } from "@/components/artist-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q")
  const [tracks, setTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [artists, setArtists] = useState<ProfileResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set())
  const [loadingTrackIds, setLoadingTrackIds] = useState<Set<number>>(new Set())
  const { playTrack, currentTrack, isPlaying, togglePlay, addToQueue, playNext } = usePlayer()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth()

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      toast.info("Admins should use the admin dashboard")
      router.push("/admin/dashboard")
    }
  }, [isAuthenticated, isAdmin, authLoading, router])

  useEffect(() => {
    const fetchResults = async () => {
      if (query) {
        setIsLoading(true)
        try {
          const [tracksData, albumsData, artistsData] = await Promise.all([
            searchTracks(query),
            makeRequest(`/search/albums?q=${encodeURIComponent(query)}`),
            searchUsers(query)
          ])
          const tracksArray = tracksData as unknown as Track[]
          setTracks(tracksArray)
          
          // Initialize liked tracks from API response
          const liked = new Set<number>()
          tracksArray.forEach(track => {
            if (track.is_favorited) {
              liked.add(track.id)
            }
          })
          setLikedTracks(liked)
          
          setAlbums(albumsData)
          setArtists(artistsData)
        } catch (error) {
          console.error("Search failed:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setTracks([])
        setAlbums([])
        setArtists([])
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

  const handleToggleFavorite = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation()
    const isCurrentlyLiked = likedTracks.has(track.id)
    
    try {
      setLoadingTrackIds(prev => new Set(prev).add(track.id))
      
      if (isCurrentlyLiked) {
        await unlikeTrack(track.id)
        setLikedTracks(prev => {
          const newSet = new Set(prev)
          newSet.delete(track.id)
          return newSet
        })
      } else {
        await likeTrack(track.id)
        setLikedTracks(prev => new Set(prev).add(track.id))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setLoadingTrackIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(track.id)
        return newSet
      })
    }
  }

  // Show loading while checking auth
  if (authLoading || (isAuthenticated && isAdmin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
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
          ) : (
            <div className="space-y-8">
              {/* Artists Section */}
              {artists.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Artists
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {artists.map((artist) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                </section>
              )}

              {/* Albums Section */}
              {albums.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Disc className="w-6 h-6" />
                    Albums
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {albums.map((album) => (
                      <AlbumCard key={album.id} album={album} />
                    ))}
                  </div>
                </section>
              )}

              {/* Tracks Section */}
              {tracks.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <PlayCircle className="w-6 h-6" />
                    Songs
                  </h2>
                  <div className="space-y-2">
                    {tracks.map((track, index) => (
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
                                playTrack(track, tracks.slice(index + 1))
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
                          <Button 
                            onClick={(e) => handleToggleFavorite(e, track)}
                            disabled={loadingTrackIds.has(track.id)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title={likedTracks.has(track.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart 
                              className={`h-4 w-4 transition-colors ${
                                likedTracks.has(track.id)
                                  ? 'fill-green-500 stroke-green-500 text-green-500'
                                  : 'stroke-current'
                              }`}
                            />
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
                </section>
              )}

              {tracks.length === 0 && albums.length === 0 && artists.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {query ? `No results found for "${query}"` : "Start searching to see results"}
                </div>
              )}
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

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, User, Plus, Trash2, Music, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAlbum, addTrackToAlbum, removeTrackFromAlbum, makeRequest } from "@/lib/api"
import { toast } from "sonner"

interface Track {
  id: number
  title: string
  artist_name: string
  duration: number
}

interface Album {
  id: number
  title: string
  artist_name: string
  cover_url?: string
  release_date?: string
  created_at: string
  tracks: Track[]
}

export default function AlbumDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [album, setAlbum] = useState<Album | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [isAddingTrack, setIsAddingTrack] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadAlbum(Number(params.id))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadAlbum = async (id: number) => {
    try {
      const data = await getAlbum(id)
      setAlbum(data)
    } catch {
      toast.error("Failed to load album")
      router.push("/admin/albums")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchTracks = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      try {
        const results = await makeRequest(`/search?q=${encodeURIComponent(query)}`)
        setSearchResults(results)
      } catch (error) {
        console.error("Search failed", error)
      }
    } else {
      setSearchResults([])
    }
  }

  const handleAddTrack = async (trackId: number) => {
    if (!album) return
    try {
      await addTrackToAlbum(album.id, trackId)
      toast.success("Track added to album")
      loadAlbum(album.id) // Reload to show new track
      setIsAddingTrack(false)
    } catch {
      toast.error("Failed to add track")
    }
  }

  const handleRemoveTrack = async (trackId: number) => {
    if (!album) return
    try {
      await removeTrackFromAlbum(album.id, trackId)
      toast.success("Track removed from album")
      loadAlbum(album.id)
    } catch {
      toast.error("Failed to remove track")
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (isLoading) return <div>Loading...</div>
  if (!album) return <div>Album not found</div>

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Album Info */}
          <div className="w-full md:w-1/3 space-y-6">
            <Card className="bg-card border-border overflow-hidden">
              <div className="aspect-square relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.cover_url || "/placeholder.svg"}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">{album.title}</h1>
                  <div className="flex items-center text-muted-foreground gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-lg">{album.artist_name}</span>
                  </div>
                </div>
                
                {album.release_date && (
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Released: {new Date(album.release_date).getFullYear()}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {album.tracks?.length || 0} Tracks
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tracks List */}
          <div className="w-full md:w-2/3">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-foreground">Tracks</CardTitle>
                <Dialog open={isAddingTrack} onOpenChange={setIsAddingTrack}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Track
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-popover border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle>Add Track to Album</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tracks..."
                          value={searchQuery}
                          onChange={(e) => handleSearchTracks(e.target.value)}
                          className="pl-10 bg-muted/50 border-input"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {searchResults.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Music className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{track.title}</div>
                                <div className="text-xs text-muted-foreground">{track.artist_name}</div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:text-primary"
                              onClick={() => handleAddTrack(track.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {searchQuery && searchResults.length === 0 && (
                          <div className="text-center text-muted-foreground py-4">
                            No tracks found
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {album.tracks && album.tracks.length > 0 ? (
                    album.tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground w-6 text-center">{index + 1}</span>
                          <div>
                            <div className="font-medium text-foreground">{track.title}</div>
                            <div className="text-sm text-muted-foreground">{formatDuration(track.duration)}</div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleRemoveTrack(track.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No tracks in this album yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

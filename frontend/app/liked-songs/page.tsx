'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayer } from '@/contexts/player-context'
import { useAuth } from '@/lib/auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Heart, Play, Pause, Music2 } from 'lucide-react'
import { getUserFavorites, likeTrack, unlikeTrack, TrackResponse } from '@/lib/api'
import { toast } from 'sonner'

export default function LikedSongsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { playTrack, currentTrack, isPlaying } = usePlayer()
  
  const [tracks, setTracks] = useState<TrackResponse[]>([])
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set())
  const [loadingTrackIds, setLoadingTrackIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated && !authLoading) {
      loadLikedSongs()
    }
  }, [isAuthenticated, authLoading, router])

  const loadLikedSongs = async () => {
    try {
      setIsLoading(true)
      const favoriteTracks = await getUserFavorites(500, 0)
      setTracks(favoriteTracks)
      
      const liked = new Set<number>()
      favoriteTracks.forEach(track => {
        if (track.is_favorited) {
          liked.add(track.id)
        }
      })
      setLikedTracks(liked)
    } catch (error) {
      console.error('Failed to load liked songs:', error)
      toast.error('Failed to load liked songs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, track: TrackResponse) => {
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
        // Remove from view
        setTracks(prev => prev.filter(t => t.id !== track.id))
        toast.success('Removed from liked songs')
      } else {
        await likeTrack(track.id)
        setLikedTracks(prev => new Set(prev).add(track.id))
        toast.success('Added to liked songs')
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      toast.error('Failed to update favorite status')
    } finally {
      setLoadingTrackIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(track.id)
        return newSet
      })
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen">
      <Sidebar className="hidden lg:flex w-64 shrink-0 fixed left-0 top-0 bottom-24 z-40" />
      
      <div className="w-full lg:ml-64 flex flex-col bg-background h-full">
        <Navbar />

        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="relative h-64 md:h-80 w-full">
            <div className="absolute inset-0 bg-gradient-to-b from-green-600 to-background z-0" />
            <div className="relative z-10 h-full p-6 flex items-end gap-6">
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-lg shadow-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <Heart className="w-24 h-24 text-white fill-white" />
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <span className="text-sm font-medium uppercase tracking-wider text-white/70">Playlist</span>
                <h1 className="text-4xl md:text-6xl font-bold text-white">Liked Songs</h1>
                <p className="text-white/80 mt-2">{tracks.length} songs</p>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <div className="p-6 flex items-center gap-4">
            <Button 
              size="lg" 
              className="rounded-full w-14 h-14 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                if (tracks.length > 0) {
                  playTrack(tracks[0], tracks)
                }
              }}
              disabled={tracks.length === 0}
            >
              {isPlaying && currentTrack?.id && tracks.some(t => t.id === currentTrack.id) ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </Button>
          </div>

          {/* Tracks List */}
          <div className="px-6 pb-12">
            {tracks.length > 0 ? (
              <div className="space-y-2">
                <div className="border-b border-border/50 pb-2 mb-4 flex text-sm text-muted-foreground px-2">
                  <div className="w-12 text-center">#</div>
                  <div className="flex-1">Title</div>
                  <div className="w-16 text-right">Duration</div>
                </div>

                {tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className="group flex items-center gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => playTrack(track, tracks)}
                  >
                    <div className="w-12 text-center text-muted-foreground group-hover:text-white">
                      <span className="group-hover:hidden">{index + 1}</span>
                      <Play className="w-4 h-4 mx-auto hidden group-hover:block fill-current" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-primary' : 'text-foreground'}`}>
                        {track.title}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {track.artist_name}
                      </div>
                    </div>

                    <div className="w-16 text-right text-sm text-muted-foreground">
                      {formatDuration(track.duration)}
                    </div>

                    {/* Heart Button */}
                    <Button
                      onClick={(e) => handleToggleFavorite(e, track)}
                      disabled={loadingTrackIds.has(track.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0"
                      title="Remove from liked songs"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors fill-green-500 stroke-green-500 text-green-500`}
                      />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
                <Music2 className="h-16 w-16 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No liked songs yet</h3>
                  <p className="text-muted-foreground">
                    Start liking songs to build your collection
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

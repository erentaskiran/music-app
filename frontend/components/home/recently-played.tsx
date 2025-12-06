"use client"

import { useEffect, useState, useCallback } from 'react'
import { usePlayer } from '@/contexts/player-context'
import { Track } from '@/lib/types'
import { getRecentlyPlayed, RecentlyPlayedResponse, likeTrack, unlikeTrack } from '@/lib/api'
import { isAuthenticated } from '@/lib/api'
import { Clock, Music2, Play, Loader2, Heart } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

// Extended track type with played_at timestamp
interface RecentlyPlayedTrack extends Track {
  played_at: string
}

export function RecentlyPlayed() {
  const [recentTracks, setRecentTracks] = useState<RecentlyPlayedTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set())
  const [loadingTrackIds, setLoadingTrackIds] = useState<Set<number>>(new Set())
  const { playTrack, currentTrack, isPlaying } = usePlayer()

  const loadRecentTracks = useCallback(async () => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      setIsLoggedIn(false)
      setLoading(false)
      return
    }

    setIsLoggedIn(true)
    
    try {
      const response = await getRecentlyPlayed(20)
      // Map API response to our track type
      const tracks: RecentlyPlayedTrack[] = response.map((t: RecentlyPlayedResponse) => ({
        id: t.id,
        title: t.title,
        artist_id: t.artist_id,
        artist_name: t.artist_name,
        file_url: t.file_url,
        duration: t.duration,
        cover_image_url: t.cover_image_url,
        genre: t.genre,
        status: t.status,
        played_at: t.played_at,
        created_at: t.played_at,
        updated_at: t.played_at,
        is_favorited: t.is_favorited,
      }))
      setRecentTracks(tracks)
      
      // Initialize liked tracks
      const liked = new Set<number>()
      tracks.forEach(track => {
        if (track.is_favorited) {
          liked.add(track.id)
        }
      })
      setLikedTracks(liked)
    } catch (error) {
      console.error('Failed to fetch recently played:', error)
      setRecentTracks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecentTracks()

    // Refresh when a track is played (listen for player state changes)
    const refreshInterval = setInterval(() => {
      if (isAuthenticated()) {
        loadRecentTracks()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [loadRecentTracks])

  // Also refresh when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      // Small delay to allow backend to record the listen
      const timeout = setTimeout(() => {
        loadRecentTracks()
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [currentTrack, loadRecentTracks])

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Recently Played</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Recently Played</h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Music2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-1">Sign in to see your listening history</p>
            <p className="text-sm text-muted-foreground/70">Your recently played tracks will appear here</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (recentTracks.length === 0) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Recently Played</h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Music2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-1">No recently played tracks</p>
            <p className="text-sm text-muted-foreground/70">Start listening to see your history here</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Recently Played</h2>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {recentTracks.map((track, index) => (
            <RecentTrackCard 
              key={`${track.id}-${track.played_at}`} 
              track={track} 
              onPlay={() => playTrack(track, recentTracks.slice(index + 1))}
              isPlaying={currentTrack?.id === track.id && isPlaying}
              isFavorited={likedTracks.has(track.id)}
              isLoading={loadingTrackIds.has(track.id)}
              onToggleFavorite={async () => {
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
              }}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

// Helper to format relative time from ISO date string
function formatRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime()
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

interface RecentTrackCardProps {
  track: RecentlyPlayedTrack
  onPlay: () => void
  isPlaying: boolean
  isFavorited: boolean
  isLoading: boolean
  onToggleFavorite: () => Promise<void>
}

function RecentTrackCard({ track, onPlay, isPlaying, isFavorited, isLoading, onToggleFavorite }: RecentTrackCardProps) {
  return (
    <Card className="group flex-shrink-0 w-[160px] overflow-hidden border-0 bg-card/50 hover:bg-card transition-colors py-0 relative">
      <CardContent className="p-0">
        <div
          className="w-full h-auto cursor-pointer"
          onClick={onPlay}
        >
          <div className="w-full">
            <div className="relative aspect-square">
              {track.cover_image_url ? (
                <Image
                  src={track.cover_image_url}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Music2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className={`w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transform transition-transform ${isPlaying ? 'scale-100' : 'scale-90 group-hover:scale-100'}`}>
                  {isPlaying ? (
                    <div className="flex gap-1">
                      <span className="w-1 h-4 bg-primary-foreground rounded animate-pulse" />
                      <span className="w-1 h-4 bg-primary-foreground rounded animate-pulse delay-75" />
                      <span className="w-1 h-4 bg-primary-foreground rounded animate-pulse delay-150" />
                    </div>
                  ) : (
                    <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                  )}
                </div>
              </div>
              
              {/* Heart button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                disabled={isLoading}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isFavorited
                      ? 'fill-green-500 stroke-green-500 text-green-500'
                      : 'stroke-white text-white'
                  }`}
                />
              </Button>
            </div>
            <div className="p-3 text-left">
              <p className="font-semibold text-sm truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.artist_name || 'Unknown Artist'}</p>
              <Badge variant="secondary" className="mt-2 text-xs">
                {formatRelativeTime(track.played_at)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

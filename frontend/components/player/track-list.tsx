"use client"

import { usePlayer } from '@/contexts/player-context'
import { PlayButton } from '@/components/player/play-button'
import { Track } from '@/lib/types'
import { Music2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { likeTrack, unlikeTrack, isAuthenticated } from '@/lib/api'

interface TrackListProps {
  tracks: Track[]
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TrackList({ tracks }: TrackListProps) {
  const { currentTrack, isPlaying } = usePlayer()
  const [likedTracks, setLikedTracks] = useState<Set<number>>(
    new Set(tracks.filter(t => t.is_favorited).map(t => t.id))
  )
  const [loadingTrackIds, setLoadingTrackIds] = useState<Set<number>>(new Set())

  // Sync liked tracks from track.is_favorited when tracks change
  useEffect(() => {
    if (isAuthenticated()) {
      const liked = new Set<number>()
      tracks.forEach(track => {
        if (track.is_favorited) {
          liked.add(track.id)
        }
      })
      setLikedTracks(liked)
    }
  }, [tracks])

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

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Music2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tracks available</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id
        
        return (
          <div
            key={track.id}
            className={`group flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-accent ${
              isCurrentTrack ? 'bg-accent' : ''
            }`}
          >
            {/* Track Number / Play Button */}
            <div className="w-8 flex items-center justify-center">
              <span className={`text-sm tabular-nums group-hover:hidden ${
                isCurrentTrack && isPlaying ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {isCurrentTrack && isPlaying ? (
                  <span className="flex gap-0.5">
                    <span className="w-0.5 h-3 bg-primary animate-pulse" />
                    <span className="w-0.5 h-3 bg-primary animate-pulse delay-75" />
                    <span className="w-0.5 h-3 bg-primary animate-pulse delay-150" />
                  </span>
                ) : (
                  index + 1
                )}
              </span>
              <div className="hidden group-hover:block">
                <PlayButton track={track} queue={tracks.slice(index + 1)} size="sm" />
              </div>
            </div>

            {/* Cover Image */}
            <div className="relative h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
              {track.cover_image_url ? (
                <Image
                  src={track.cover_image_url}
                  alt={track.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Music2 className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm truncate ${
                isCurrentTrack ? 'text-primary' : 'text-foreground'
              }`}>
                {track.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {track.artist_name || `Artist #${track.artist_id}`}
              </p>
            </div>

            {/* Genre */}
            {track.genre && (
              <span className="hidden sm:block text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                {track.genre}
              </span>
            )}

            {/* Duration */}
            <span className="text-sm text-muted-foreground tabular-nums w-12 text-right">
              {formatDuration(track.duration)}
            </span>

            {/* Like Button */}
            <Button
              onClick={(e) => handleToggleFavorite(e, track)}
              disabled={loadingTrackIds.has(track.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title={likedTracks.has(track.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  likedTracks.has(track.id)
                    ? 'fill-green-500 stroke-green-500 text-green-500'
                    : 'stroke-current'
                }`}
              />
            </Button>
          </div>
        )
      })}
    </div>
  )
}

"use client"

import { usePlayer } from '@/contexts/player-context'
import { PlayButton } from '@/components/player/play-button'
import { Track } from '@/lib/types'
import { Music2 } from 'lucide-react'
import Image from 'next/image'

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

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
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
            className={`group flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-white/10 ${
              isCurrentTrack ? 'bg-white/10' : ''
            }`}
          >
            {/* Track Number / Play Button */}
            <div className="w-8 flex items-center justify-center">
              <span className={`text-sm tabular-nums group-hover:hidden ${
                isCurrentTrack && isPlaying ? 'text-green-500' : 'text-zinc-400'
              }`}>
                {isCurrentTrack && isPlaying ? (
                  <span className="flex gap-0.5">
                    <span className="w-0.5 h-3 bg-green-500 animate-pulse" />
                    <span className="w-0.5 h-3 bg-green-500 animate-pulse delay-75" />
                    <span className="w-0.5 h-3 bg-green-500 animate-pulse delay-150" />
                  </span>
                ) : (
                  index + 1
                )}
              </span>
              <div className="hidden group-hover:block">
                <PlayButton track={track} size="sm" />
              </div>
            </div>

            {/* Cover Image */}
            <div className="relative h-10 w-10 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
              {track.cover_image_url ? (
                <Image
                  src={track.cover_image_url}
                  alt={track.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                  <Music2 className="w-4 h-4 text-zinc-500" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm truncate ${
                isCurrentTrack ? 'text-green-500' : 'text-white'
              }`}>
                {track.title}
              </h4>
              <p className="text-xs text-zinc-400 truncate">
                {track.artist_name || `Artist #${track.artist_id}`}
              </p>
            </div>

            {/* Genre */}
            {track.genre && (
              <span className="hidden sm:block text-xs text-zinc-500 px-2 py-1 rounded-full bg-white/5">
                {track.genre}
              </span>
            )}

            {/* Duration */}
            <span className="text-sm text-zinc-400 tabular-nums w-12 text-right">
              {formatDuration(track.duration)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

"use client"

import { Play, Pause, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/contexts/player-context'
import { Track } from '@/lib/types'

interface PlayButtonProps {
  track: Track
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlayButton({ track, size = 'md', className = '' }: PlayButtonProps) {
  const { currentTrack, isPlaying, isLoading, playTrack, togglePlay } = usePlayer()

  const isCurrentTrack = currentTrack?.id === track.id
  const isThisTrackPlaying = isCurrentTrack && isPlaying
  const isThisTrackLoading = isCurrentTrack && isLoading

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isCurrentTrack) {
      togglePlay()
    } else {
      playTrack(track)
    }
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full bg-green-500 text-black hover:bg-green-400 hover:scale-105 transition-all shadow-lg ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      disabled={isThisTrackLoading}
    >
      {isThisTrackLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : isThisTrackPlaying ? (
        <Pause className={iconSizes[size]} fill="currentColor" />
      ) : (
        <Play className={`${iconSizes[size]} ml-0.5`} fill="currentColor" />
      )}
    </Button>
  )
}

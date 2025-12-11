"use client"

import React from 'react'
import { usePlayer } from '@/contexts/player-context'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Loader2,
  Music2,
  Heart,
} from 'lucide-react'
import Image from 'next/image'
import { likeTrack, unlikeTrack } from '@/lib/api'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function MusicPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
  } = usePlayer()

  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (currentTrack) {
      setIsLiked(!!currentTrack.is_favorited)
    }
  }, [currentTrack])

  const handleLikeToggle = async () => {
    if (!currentTrack) return
    
    try {
      if (isLiked) {
        await unlikeTrack(currentTrack.id)
        setIsLiked(false)
        toast.success('Removed from favorites')
      } else {
        await likeTrack(currentTrack.id)
        setIsLiked(true)
        toast.success('Added to favorites')
      }
    } catch (error) {
      toast.error('Failed to update favorites')
    }
  }

  // Don't render if no track is selected
  if (!currentTrack) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    seek(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100)
  }

  const VolumeIcon = isMuted || volume === 0 
    ? VolumeX 
    : volume < 0.5 
      ? Volume1 
      : Volume2

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-card to-card/95 backdrop-blur-lg border-t border-border">
      {/* Progress bar at top - thin line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-border cursor-pointer group">
        <div 
          className="h-full bg-foreground transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="absolute top-0 left-0 right-0 h-1"
          />
        </div>
      </div>

      <div className="flex items-center justify-between h-20 px-4">
        {/* Left: Track Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Album Art */}
          <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-lg">
            {currentTrack.cover_image_url ? (
              <Image
                src={currentTrack.cover_image_url}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Music2 className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Track Details */}
          <div className="min-w-0">
            <h4 className="text-foreground font-medium text-sm truncate">
              {currentTrack.title}
            </h4>
            <p className="text-muted-foreground text-xs truncate">
              {currentTrack.artist_name || `Artist #${currentTrack.artist_id}`}
            </p>
          </div>

          {/* Like Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={handleLikeToggle}
          >
            <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
          </Button>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            {/* Skip Back */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={previousTrack}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform"
              onClick={togglePlay}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              )}
            </Button>

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={nextTrack}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Time & Progress (Desktop) */}
          <div className="hidden md:flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center justify-end gap-2 flex-1">
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleMute}
            >
              <VolumeIcon className="h-4 w-4" />
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

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
} from 'lucide-react'
import Image from 'next/image'

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
  } = usePlayer()

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-zinc-900 to-zinc-900/95 backdrop-blur-lg border-t border-white/10">
      {/* Progress bar at top - thin line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 cursor-pointer group">
        <div 
          className="h-full bg-white transition-all duration-100"
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
          <div className="relative h-14 w-14 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 shadow-lg">
            {currentTrack.cover_image_url ? (
              <Image
                src={currentTrack.cover_image_url}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                <Music2 className="w-6 h-6 text-zinc-500" />
              </div>
            )}
          </div>

          {/* Track Details */}
          <div className="min-w-0">
            <h4 className="text-white font-medium text-sm truncate">
              {currentTrack.title}
            </h4>
            <p className="text-zinc-400 text-xs truncate">
              {currentTrack.artist_name || `Artist #${currentTrack.artist_id}`}
            </p>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            {/* Skip Back */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
              disabled
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-transform"
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
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
              disabled
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Time & Progress (Desktop) */}
          <div className="hidden md:flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-zinc-400 w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-zinc-400 w-10 tabular-nums">
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
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
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

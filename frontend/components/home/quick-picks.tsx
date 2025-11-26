"use client"

import { useEffect, useState } from 'react'
import { usePlayer } from '@/contexts/player-context'
import { Track } from '@/lib/types'
import { getTracks, TrackResponse } from '@/lib/api'
import { Sparkles, Music2, Play, Loader2, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function QuickPicks() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const { playTrack, currentTrack, isPlaying } = usePlayer()

  useEffect(() => {
    async function fetchTracks() {
      try {
        setLoading(true)
        const response = await getTracks(6, 0)
        const mappedTracks: Track[] = response.map((t: TrackResponse) => ({
          id: t.id,
          title: t.title,
          artist_id: t.artist_id,
          artist_name: t.artist_name,
          file_url: t.file_url,
          duration: t.duration,
          cover_image_url: t.cover_image_url,
          genre: t.genre,
          lyrics: t.lyrics,
          quality_bitrate: t.quality_bitrate,
          status: t.status,
          created_at: t.created_at,
          updated_at: t.updated_at,
        }))
        setTracks(mappedTracks)
      } catch (error) {
        console.error('Failed to fetch quick picks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [])

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0])
    }
  }

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length)
      playTrack(tracks[randomIndex])
    }
  }

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Quick Picks for You</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  if (tracks.length === 0) {
    return null
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-bold">Quick Picks for You</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button
            size="sm"
            onClick={handlePlayAll}
          >
            <Play className="h-4 w-4 mr-2 fill-current" />
            Play All
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tracks.map((track) => (
          <QuickPickCard 
            key={track.id} 
            track={track} 
            onPlay={() => playTrack(track)}
            isPlaying={currentTrack?.id === track.id && isPlaying}
          />
        ))}
      </div>
    </section>
  )
}

interface QuickPickCardProps {
  track: Track
  onPlay: () => void
  isPlaying: boolean
}

function QuickPickCard({ track, onPlay, isPlaying }: QuickPickCardProps) {
  return (
    <Card className={`group border-0 py-0 ${isPlaying ? 'ring-1 ring-primary' : ''}`}>
      <CardContent className="p-0">
        <Button
          variant="ghost"
          className="w-full h-auto p-3 justify-start gap-3 hover:bg-accent"
          onClick={onPlay}
        >
          <Avatar className="h-12 w-12 rounded">
            {track.cover_image_url ? (
              <AvatarImage src={track.cover_image_url} alt={track.title} />
            ) : null}
            <AvatarFallback className="rounded">
              <Music2 className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 text-left">
            <p className={`font-semibold text-sm truncate ${isPlaying ? 'text-primary' : ''}`}>
              {track.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">{track.artist_name || 'Unknown Artist'}</p>
          </div>
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-primary' 
              : 'bg-muted opacity-0 group-hover:opacity-100'
          }`}>
            {isPlaying ? (
              <div className="flex gap-0.5">
                <span className="w-0.5 h-3 bg-primary-foreground rounded animate-pulse" />
                <span className="w-0.5 h-3 bg-primary-foreground rounded animate-pulse delay-75" />
                <span className="w-0.5 h-3 bg-primary-foreground rounded animate-pulse delay-150" />
              </div>
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </div>
        </Button>
      </CardContent>
    </Card>
  )
}

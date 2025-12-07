'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { usePlayer } from '@/contexts/player-context'
import { getAlbum, likeTrack, unlikeTrack } from '@/lib/api'
import { AlbumWithTracks } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Play, Pause, Clock, Heart } from 'lucide-react'
import Image from 'next/image'
import { formatDuration } from '@/lib/utils'

export default function AlbumPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  const [album, setAlbum] = useState<AlbumWithTracks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set())
  const [loadingTrackIds, setLoadingTrackIds] = useState<Set<number>>(new Set())
  const { playTrack, currentTrack, isPlaying } = usePlayer()

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const data = await getAlbum(id)
        setAlbum(data)
        
        // Initialize liked tracks from API response
        const liked = new Set<number>()
        data.tracks?.forEach((track: Track) => {
          if (track.is_favorited) {
            liked.add(track.id)
          }
        })
        setLikedTracks(liked)
      } catch (error) {
        console.error('Failed to load album:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAlbum()
  }, [id])

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (!album) return <div className="p-8 text-center">Album not found</div>

  const handlePlayAlbum = () => {
    if (album.tracks && album.tracks.length > 0) {
      playTrack(album.tracks[0], album.tracks)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, trackId: number) => {
    e.stopPropagation()
    const isCurrentlyLiked = likedTracks.has(trackId)
    
    try {
      setLoadingTrackIds(prev => new Set(prev).add(trackId))
      
      if (isCurrentlyLiked) {
        await unlikeTrack(trackId)
        setLikedTracks(prev => {
          const newSet = new Set(prev)
          newSet.delete(trackId)
          return newSet
        })
      } else {
        await likeTrack(trackId)
        setLikedTracks(prev => new Set(prev).add(trackId))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setLoadingTrackIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(trackId)
        return newSet
      })
    }
  }

  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : null

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Header */}
      <div className="relative h-64 md:h-80 w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background z-0" />
        <div className="relative z-10 h-full p-6 flex items-end gap-6">
          <div className="relative w-40 h-40 md:w-52 md:h-52 shadow-xl rounded-md overflow-hidden bg-card">
            <Image
              src={album.cover_url || "/placeholder.svg"}
              alt={album.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-2 mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Album</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white">{album.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-white">{album.artist_name}</span>
              {releaseYear && (
                <>
                  <span>•</span>
                  <span>{releaseYear}</span>
                </>
              )}
              <span>•</span>
              <span>{album.tracks?.length || 0} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 flex items-center gap-4">
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handlePlayAlbum}
          disabled={!album.tracks || album.tracks.length === 0}
        >
          {isPlaying && currentTrack?.id && album.tracks?.some(t => t.id === currentTrack.id) ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-1" />
          )}
        </Button>
      </div>

      {/* Tracks List */}
      <div className="px-6 pb-12">
        <div className="border-b border-border/50 pb-2 mb-4 flex text-sm text-muted-foreground">
          <div className="w-12 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-16 text-right"><Clock className="w-4 h-4 ml-auto" /></div>
        </div>
        
        <div className="space-y-2">
          {album.tracks?.map((track, index) => (
            <div 
              key={track.id}
              className="group flex items-center py-2 px-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => playTrack(track, album.tracks || [])}
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
              
              {/* Heart button */}
              <Button
                onClick={(e) => handleToggleFavorite(e, track.id)}
                disabled={loadingTrackIds.has(track.id)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 ml-2"
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
          ))}
          {(!album.tracks || album.tracks.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No tracks in this album yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

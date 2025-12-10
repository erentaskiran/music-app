'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getArtistDetails, getArtistTopTracks, getArtistAlbums } from '@/lib/api'
import { ArtistDetails, Track, Album } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Music, Disc3, Play } from 'lucide-react'
import { TrackList } from '@/components/player/track-list'
import { AlbumCard } from '@/components/album-card'
import { usePlayer } from '@/contexts/player-context'

export default function ArtistPage() {
  const params = useParams()
  const router = useRouter()
  const { playTrack } = usePlayer()
  const [artist, setArtist] = useState<ArtistDetails | null>(null)
  const [topTracks, setTopTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const artistId = Number(params.id)

  useEffect(() => {
    if (!artistId || isNaN(artistId)) {
      setError('Invalid artist ID')
      setLoading(false)
      return
    }

    const fetchArtistData = async () => {
      try {
        setLoading(true)
        const [artistData, tracksData, albumsData] = await Promise.all([
          getArtistDetails(artistId),
          getArtistTopTracks(artistId, 10),
          getArtistAlbums(artistId),
        ])

        setArtist(artistData)
        setTopTracks(tracksData)
        setAlbums(albumsData)
        setError(null)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to load artist information')
        } else {
          setError('Failed to load artist information. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchArtistData()
  }, [artistId])

  const handlePlayAll = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks.slice(1))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading artist...</p>
        </div>
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Artist Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'The artist you are looking for does not exist.'}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const initials = artist.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-primary/20 to-transparent">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6 hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 pb-8">
            {/* Artist Avatar */}
            <Avatar className="h-48 w-48 shadow-2xl border-4 border-background">
              {artist.avatar_url ? (
                <AvatarImage src={artist.avatar_url} alt={artist.username} />
              ) : (
                <AvatarFallback className="text-5xl font-bold bg-primary/20">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Artist Info */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Artist
              </p>
              <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
                {artist.username}
              </h1>
              {artist.bio && (
                <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
                  {artist.bio}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  {artist.total_tracks} {artist.total_tracks === 1 ? 'track' : 'tracks'}
                </span>
                <span className="flex items-center gap-1">
                  <Disc3 className="h-4 w-4" />
                  {artist.total_albums} {artist.total_albums === 1 ? 'album' : 'albums'}
                </span>
                {artist.total_listens > 0 && (
                  <span className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    {artist.total_listens.toLocaleString()} plays
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Top Tracks Section */}
        {topTracks.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Popular Tracks</h2>
              <Button onClick={handlePlayAll} size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Play All
              </Button>
            </div>
            <TrackList tracks={topTracks} />
          </div>
        )}

        {/* Albums Section */}
        {albums.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Discography</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </div>
        )}

        {/* No Content Placeholder */}
        {topTracks.length === 0 && albums.length === 0 && (
          <div className="text-center py-16">
            <Music className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold mb-2">No Content Available</h3>
            <p className="text-muted-foreground">
              This artist hasn&apos;t released any music yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

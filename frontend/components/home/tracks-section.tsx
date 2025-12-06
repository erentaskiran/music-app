"use client"

import { useEffect, useState } from 'react'
import { getTracks, TrackResponse } from '@/lib/api'
import { TrackList } from '@/components/player/track-list'
import { Track } from '@/lib/types'
import { Music2, Loader2, Disc3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function TracksSection() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTracks() {
      try {
        setLoading(true)
        const response = await getTracks(20, 0)
        // Map API response to Track type
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
          is_favorited: t.is_favorited || false,
        }))
        setTracks(mappedTracks)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tracks')
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [])

  if (loading) {
    return (
      <section className="py-8">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Disc3 className="h-5 w-5 text-chart-2" />
              All Tracks
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-8">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Disc3 className="h-5 w-5 text-chart-2" />
              All Tracks
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Music2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="py-8">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Disc3 className="h-5 w-5 text-chart-2" />
            All Tracks
            <Badge variant="secondary" className="ml-2">
              {tracks.length} songs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrackList tracks={tracks} />
        </CardContent>
      </Card>
    </section>
  )
}

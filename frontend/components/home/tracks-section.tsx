"use client"

import { useEffect, useState } from 'react'
import { getTracks, TrackResponse } from '@/lib/api'
import { TrackList } from '@/components/player/track-list'
import { Track } from '@/lib/types'
import { Music2, Loader2 } from 'lucide-react'

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
        <h2 className="text-2xl font-bold text-white mb-6">All Tracks</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-bold text-white mb-6">All Tracks</h2>
        <div className="text-center py-12 text-zinc-500">
          <Music2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-white mb-6">All Tracks</h2>
      <div className="bg-white/5 rounded-lg p-4">
        <TrackList tracks={tracks} />
      </div>
    </section>
  )
}

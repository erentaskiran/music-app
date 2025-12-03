"use client"

import { useEffect, useState } from "react"
import { AlbumCard } from '@/components/album-card'
import { Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAlbums } from "@/lib/api"
import { Album } from "@/lib/types"

export function RecommendedAlbums() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const data = await getAlbums()
        // For now, just take the first 10 albums as "recommended"
        // In a real app, this would be a personalized recommendation endpoint
        setAlbums(data.slice(0, 10))
      } catch (error) {
        console.error("Failed to fetch recommended albums", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlbums()
  }, [])

  if (isLoading) return null
  if (albums.length === 0) return null

  return (
    <section className="py-8">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-chart-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

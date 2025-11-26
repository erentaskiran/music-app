'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface Album {
  id: number
  title: string
  artist: string
  cover: string
}

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-shadow duration-300">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={album.cover || "/placeholder.svg"}
              alt={`${album.title} by ${album.artist}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold line-clamp-1">{album.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{album.artist}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

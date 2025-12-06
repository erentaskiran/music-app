'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUserFavorites, isAuthenticated } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Heart } from 'lucide-react'

export function LikedSongsCard() {
  const router = useRouter()
  const [likedCount, setLikedCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated()) {
      return
    }

    const loadLikedCount = async () => {
      try {
        const tracks = await getUserFavorites(1, 0)
        setLikedCount(tracks.length || 0)
      } catch (error) {
        console.error('Failed to load liked songs count:', error)
      }
    }

    loadLikedCount()
  }, [])

  const handleClick = () => {
    router.push('/liked-songs')
  }

  return (
    <Card 
      onClick={handleClick}
      className="mb-6 bg-gradient-to-br from-purple-700 to-blue-500 border-0 py-0 cursor-pointer hover:shadow-lg hover:shadow-purple-500/50 transition-all group"
    >
      <div className="p-6 flex items-start justify-between h-32">
        <div className="flex-1">
          <p className="text-sm text-white/70 mb-2">Your Liked Songs</p>
          <h3 className="text-2xl font-bold text-white mb-1">Liked Songs</h3>
          <p className="text-white/80">{likedCount} songs</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded bg-white/10 group-hover:bg-white/20 transition-colors">
          <Heart className="h-6 w-6 text-white fill-white group-hover:scale-110 transition-transform" />
        </div>
      </div>
    </Card>
  )
}

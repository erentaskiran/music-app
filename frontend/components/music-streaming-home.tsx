'use client'

import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { AlbumCard } from '@/components/album-card'
import { Music } from 'lucide-react'

const featuredAlbums = [
  {
    id: 1,
    title: 'Midnight Dreams',
    artist: 'Luna Eclipse',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 2,
    title: 'Neon Nights',
    artist: 'The Synthwave Collective',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 3,
    title: 'Ocean Waves',
    artist: 'Coastal Hearts',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 4,
    title: 'Urban Echo',
    artist: 'Metro Souls',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 5,
    title: 'Desert Sun',
    artist: 'Amber Valley',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 6,
    title: 'Electric Pulse',
    artist: 'Nova Force',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  }
]

const recommendedAlbums = [
  {
    id: 7,
    title: 'Morning Coffee',
    artist: 'Jazz Café Ensemble',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 8,
    title: 'Starlight Symphony',
    artist: 'Celestial Orchestra',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 9,
    title: 'Retro Vibes',
    artist: 'The Analog Kids',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 10,
    title: 'Mountain High',
    artist: 'Alpine Echoes',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 11,
    title: 'Digital Dreams',
    artist: 'Cyber Souls',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 12,
    title: 'Summer Breeze',
    artist: 'Sunset Boulevard',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 13,
    title: 'Velvet Night',
    artist: 'Smooth Operators',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  },
  {
    id: 14,
    title: 'Thunder Road',
    artist: 'Highway Rebels',
    cover: 'https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg'
  }
]

export function MusicStreamingHome() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0c]/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-white md:h-8 md:w-8" />
            <span className="hidden text-xl font-bold md:inline">Musicly</span>
          </div>

          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search for albums, artists..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:ring-white/20"
            />
          </div>

          <Avatar className="h-9 w-9 md:h-10 md:w-10">
            <AvatarImage src="/diverse-user-avatars.png" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 md:px-6">
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">Featured Albums</h2>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {featuredAlbums.map((album) => (
                <div key={album.id} className="w-[200px] md:w-[240px]">
                  <AlbumCard album={album} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">Recommended for You</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {recommendedAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

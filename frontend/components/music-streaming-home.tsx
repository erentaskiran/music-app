'use client'

import { Navbar } from '@/components/navbar'
import { FeaturedAlbums } from '@/components/home/featured-albums'
import { RecommendedAlbums } from '@/components/home/recommended-albums'
import { TracksSection } from '@/components/home/tracks-section'

export function MusicStreamingHome() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:px-6">
        <FeaturedAlbums />
        <TracksSection />
        <RecommendedAlbums />
      </main>
    </div>
  )
}

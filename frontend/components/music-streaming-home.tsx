'use client'

import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { FeaturedAlbums } from '@/components/home/featured-albums'
import { RecommendedAlbums } from '@/components/home/recommended-albums'
import { TracksSection } from '@/components/home/tracks-section'
import { RecentlyPlayed } from '@/components/home/recently-played'
import { QuickPicks } from '@/components/home/quick-picks'
import { WelcomeSection } from '@/components/home/welcome-section'
import { LikedSongsCard } from '@/components/home/liked-songs-card'

export function MusicStreamingHome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Left Sidebar - Hidden on mobile, Fixed position */}
      <Sidebar className="hidden lg:flex w-64 flex-shrink-0 fixed left-0 top-0 bottom-0 z-40 overflow-y-auto" />

      {/* Main Content Area with margin for sidebar */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 px-4 py-6 md:px-8 overflow-y-auto pb-24">
          <WelcomeSection />
          <LikedSongsCard />
          <QuickPicks />
          <RecentlyPlayed />
          <FeaturedAlbums />
          <TracksSection />
          <RecommendedAlbums />
        </main>
      </div>
    </div>
  )
}

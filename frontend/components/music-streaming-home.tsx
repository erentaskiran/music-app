'use client'

import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { FeaturedAlbums } from '@/components/home/featured-albums'
import { RecommendedAlbums } from '@/components/home/recommended-albums'
import { TracksSection } from '@/components/home/tracks-section'
import { RecentlyPlayed } from '@/components/home/recently-played'
import { QuickPicks } from '@/components/home/quick-picks'
import { WelcomeSection } from '@/components/home/welcome-section'

export function MusicStreamingHome() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar - Hidden on mobile */}
      <Sidebar className="hidden lg:flex w-64 flex-shrink-0 fixed left-0 top-0 bottom-24 z-40" />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        <Navbar />

        <main className="px-4 py-6 md:px-8">
          <WelcomeSection />
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

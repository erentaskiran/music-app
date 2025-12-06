import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { PlayerProvider } from '@/contexts/player-context'
import { PlaylistProvider } from '@/contexts/playlist-context'
import { MusicPlayerBar } from '@/components/player/music-player-bar'
import "./globals.css"


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Musicly - Your Music Streaming App',
  description: 'Stream your favorite music with Musicly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-x-hidden`}>
        <PlaylistProvider>
          <PlayerProvider>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
            <MusicPlayerBar />
          </PlayerProvider>
        </PlaylistProvider>
        <Toaster />
      </body>
    </html>
  )
}

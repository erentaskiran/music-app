import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { PlayerProvider } from '@/contexts/player-context'
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
      <body className={inter.className}>
        <PlayerProvider>
          <div className="pb-24">
            {children}
          </div>
          <MusicPlayerBar />
        </PlayerProvider>
        <Toaster />
      </body>
    </html>
  )
}

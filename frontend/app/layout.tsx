import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
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
        {children}
        <Toaster />
      </body>
    </html>
  )
}

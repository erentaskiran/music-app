"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  Search, 
  Library, 
  Plus, 
  Heart, 
  Music2, 
  ListMusic,
  Clock,
  LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

interface Playlist {
  id: number
  name: string
  trackCount: number
  coverUrl?: string
}

// Mock playlists data - replace with API data later
const mockPlaylists: Playlist[] = [
  { id: 1, name: 'My Favorites', trackCount: 45 },
  { id: 2, name: 'Chill Vibes', trackCount: 32 },
  { id: 3, name: 'Workout Mix', trackCount: 28 },
  { id: 4, name: 'Late Night Coding', trackCount: 56 },
  { id: 5, name: 'Road Trip', trackCount: 42 },
  { id: 6, name: 'Focus Mode', trackCount: 24 },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('home')
  const { isAuthenticated, isLoading, requireAuth } = useAuth()
  const router = useRouter()

  const handleRecentlyPlayedClick = () => {
    if (requireAuth()) {
      setActiveItem('recent')
    }
  }

  const handleLibraryAction = () => {
    requireAuth()
  }

  return (
    <TooltipProvider>
      <aside className={cn(
        "flex flex-col bg-card border-r h-full",
        className
      )}>
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Music2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Musicly</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 space-y-1">
          <NavItem 
            icon={Home} 
            label="Home" 
            isActive={activeItem === 'home'}
            onClick={() => setActiveItem('home')}
          />
          <NavItem 
            icon={Search} 
            label="Search" 
            isActive={activeItem === 'search'}
            onClick={() => setActiveItem('search')}
          />
          <NavItem 
            icon={Clock} 
            label="Recently Played" 
            isActive={activeItem === 'recent'}
            onClick={handleRecentlyPlayedClick}
          />
        </nav>

        <Separator className="my-4 mx-3" />

        {/* Library Section - Show loading skeleton, then auth-based content */}
        {isLoading ? (
          /* Loading state - show skeleton */
          <div className="flex-1 px-3">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-16 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-20" />
              <div className="space-y-2">
                <div className="h-12 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          </div>
        ) : isAuthenticated ? (
          <>
            <div className="px-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Library className="h-5 w-5" />
                  <span className="font-semibold text-sm">Your Library</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleLibraryAction}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create playlist</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Liked Songs Card */}
              <Card className="mb-4 bg-gradient-to-br from-purple-700 to-blue-500 border-0 py-0">
                <CardContent className="p-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 p-0 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-white/10">
                      <Heart className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">Liked Songs</p>
                      <p className="text-xs text-white/70">128 songs</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Playlists */}
            <div className="flex-1 px-3 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Playlists
                </span>
              </div>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <div className="space-y-1 pr-3">
                  {mockPlaylists.map((playlist) => (
                    <PlaylistItem key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator className="mx-3" />

            {/* Create Playlist Button */}
            <div className="p-4">
              <Button 
                variant="secondary"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Playlist
              </Button>
            </div>
          </>
        ) : (
          /* Login prompt for unauthenticated users */
          <div className="flex-1 px-3 flex flex-col">
            <Card className="border-border bg-muted/50">
              <CardContent className="p-4 text-center">
                <Library className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Your Library</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Sign in to create playlists and save your favorite songs
                </p>
                <Button 
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/login')}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}

interface NavItemProps {
  icon: React.ElementType
  label: string
  isActive?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-3",
        !isActive && "text-muted-foreground"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Button>
  )
}

interface PlaylistItemProps {
  playlist: Playlist
}

function PlaylistItem({ playlist }: PlaylistItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-auto py-2 text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded bg-muted">
            <ListMusic className="h-5 w-5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{playlist.name}</p>
            <p className="text-xs text-muted-foreground">{playlist.trackCount} songs</p>
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{playlist.name}</p>
      </TooltipContent>
    </Tooltip>
  )
}

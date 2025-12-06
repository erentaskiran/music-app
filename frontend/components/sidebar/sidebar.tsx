"use client"

import { useState, useEffect } from 'react'
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
  LogIn,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { usePlaylist } from '@/contexts/playlist-context'
import { getUserFavorites } from '@/lib/api'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('home')
  const { isAuthenticated, isLoading, requireAuth } = useAuth()
  const { playlists, isLoading: playlistsLoading, createPlaylist, deletePlaylist } = usePlaylist()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [likedCount, setLikedCount] = useState(0)

  const handleRecentlyPlayedClick = () => {
    if (requireAuth()) {
      setActiveItem('recent')
    }
  }

  const handleCreatePlaylist = async () => {
    if (!requireAuth()) return
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!playlistName.trim()) return
    
    setIsCreating(true)
    try {
      await createPlaylist(playlistName)
      setPlaylistName('')
      setShowDialog(false)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    setPlaylistName('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleDialogClose()
    }
  }

  const handleDeletePlaylist = async (playlistId: number) => {
    try {
      await deletePlaylist(playlistId)
    } catch (error) {
      console.error('Failed to delete playlist:', error)
    }
  }

  // Load liked songs count
  useEffect(() => {
    if (!isAuthenticated) return
    
    const loadLikedCount = async () => {
      try {
        const tracks = await getUserFavorites(100, 0)
        setLikedCount(tracks.length || 0)
      } catch (error) {
        console.error('Failed to load liked count:', error)
      }
    }

    loadLikedCount()
  }, [isAuthenticated])

  return (
    <TooltipProvider>
      <aside className={cn(
        "flex flex-col bg-card border-r h-full",
        className
      )}>
        {/* Logo */}
        <div className="p-6 cursor-pointer" onClick={() => router.push('/')}>
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
            onClick={() => {
              setActiveItem('home')
              router.push('/')
            }}
          />
          <NavItem 
            icon={Search} 
            label="Search" 
            isActive={activeItem === 'search'}
            onClick={() => {
              setActiveItem('search')
              router.push('/search')
            }}
          />
          <NavItem 
            icon={Clock} 
            label="Recently Played" 
            isActive={activeItem === 'recent'}
            onClick={handleRecentlyPlayedClick}
          />
        </nav>

        <Separator className="my-4 mx-3" />

        {/* Library Section */}
        {isLoading ? (
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
                      onClick={handleCreatePlaylist}
                      disabled={isCreating}
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
              <Card className="mb-4 bg-gradient-to-br from-purple-700 to-blue-500 border-0 py-0 cursor-pointer hover:opacity-90 transition-opacity">
                <CardContent className="p-3">
                  <div 
                    className="w-full justify-start gap-3 p-0 h-auto flex items-center"
                    onClick={() => router.push('/liked-songs')}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-white/10">
                      <Heart className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">Liked Songs</p>
                      <p className="text-xs text-white/70">{likedCount} {likedCount === 1 ? 'song' : 'songs'}</p>
                    </div>
                  </div>
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
              {playlistsLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              ) : playlists.length > 0 ? (
                <ScrollArea className="h-[calc(100%-2rem)]">
                  <div className="space-y-1 pr-3">
                    {playlists
                      .filter(playlist => playlist.title !== 'Liked Songs')
                      .map((playlist) => (
                        <PlaylistItem 
                          key={playlist.id} 
                          playlist={playlist}
                          onSelect={() => router.push(`/playlist/${playlist.id}`)}
                          onDelete={handleDeletePlaylist}
                        />
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-xs text-muted-foreground py-4">No playlists yet</p>
              )}
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

      {/* Create Playlist Dialog */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Playlist name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || !playlistName.trim()}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  playlist: { id: number; title: string }
  onSelect?: () => void
  onDelete?: (id: number) => void
}

function PlaylistItem({ playlist, onSelect, onDelete }: PlaylistItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 group">
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-3 h-auto py-2 text-muted-foreground hover:text-foreground"
            onClick={onSelect}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded bg-muted">
              <ListMusic className="h-5 w-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{playlist.title}</p>
            </div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              if (onDelete) {
                onDelete(playlist.id)
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{playlist.title}</p>
      </TooltipContent>
    </Tooltip>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePlaylist } from '@/contexts/playlist-context'
import { usePlayer } from '@/contexts/player-context'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar } from "@/components/sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  ArrowLeft, 
  Trash2, 
  Plus,
  Music,
  MoreVertical,
  X,
  Search,
  Play,
  Heart,
  Upload,
  Loader2
} from 'lucide-react'
import { searchTracks, likeTrack, unlikeTrack, uploadPlaylistCover } from '@/lib/api'
import { toast } from 'sonner'
import type { Track } from '@/lib/types'

export default function PlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = parseInt(params.id as string)
  
  const { selectedPlaylist, selectPlaylist, updatePlaylist, deletePlaylist, removeTrackFromPlaylist, addTrackToPlaylist } = usePlaylist()
  const { playTrack, currentTrack, isPlaying } = usePlayer()
  const [isLoading, setIsLoading] = useState(true)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showAddTracks, setShowAddTracks] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingTrackId, setAddingTrackId] = useState<number | null>(null)
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set())
  const [loadingTrackIds, setLoadingTrackIds] = useState<Set<number>>(new Set())
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showAddTracks && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showAddTracks])

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        await selectPlaylist(playlistId)
      } catch (err) {
        console.error('Failed to load playlist:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlaylist()
  }, [playlistId, selectPlaylist])

  useEffect(() => {
    if (selectedPlaylist) {
      console.log('=== PLAYLIST LOADED ===')
      console.log('Playlist ID:', selectedPlaylist.id)
      console.log('Playlist Title:', selectedPlaylist.title)
      console.log('Total Tracks:', selectedPlaylist.tracks?.length || 0)
      console.log('Tracks:', selectedPlaylist.tracks?.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist_name,
        duration: t.duration
      })))
      
      // Initialize liked tracks
      const liked = new Set<number>()
      selectedPlaylist.tracks?.forEach(track => {
        if (track.is_favorited) {
          liked.add(track.id)
        }
      })
      setLikedTracks(liked)
    }
  }, [selectedPlaylist])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchTracks(query, 20)
      const filteredResults = results.filter(
        (track) => !selectedPlaylist?.tracks.some((t) => t.id === track.id)
      )
      setSearchResults(filteredResults)
    } catch (err) {
      console.error('Failed to search tracks:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddTrack = async (trackId: number) => {
    setAddingTrackId(trackId)
    console.log(`Adding track ${trackId} to playlist ${playlistId}`)
    try {
      await addTrackToPlaylist(playlistId, trackId)
      console.log(`Successfully added track ${trackId} to playlist ${playlistId}`)
      setSearchResults(searchResults.filter((t) => t.id !== trackId))
    } catch (err) {
      console.error('Failed to add track:', err)
    } finally {
      setAddingTrackId(null)
    }
  }

  const handleUpdateTitle = async () => {
    if (!editTitle.trim() || !selectedPlaylist) return
    
    try {
      await updatePlaylist(playlistId, editTitle)
      setIsEditingTitle(false)
      setShowEditMenu(false)
    } catch (err) {
      console.error('Failed to update playlist:', err)
    }
  }

  const handleDeletePlaylist = async () => {
    try {
      await deletePlaylist(playlistId)
      router.push('/')
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }

  const handleRemoveTrack = async (trackId: number) => {
    try {
      await removeTrackFromPlaylist(playlistId, trackId)
    } catch (err) {
      console.error('Failed to remove track:', err)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, trackId: number) => {
    e.stopPropagation()
    const isCurrentlyLiked = likedTracks.has(trackId)
    
    try {
      setLoadingTrackIds(prev => new Set(prev).add(trackId))
      
      if (isCurrentlyLiked) {
        await unlikeTrack(trackId)
        setLikedTracks(prev => {
          const newSet = new Set(prev)
          newSet.delete(trackId)
          return newSet
        })
      } else {
        await likeTrack(trackId)
        setLikedTracks(prev => new Set(prev).add(trackId))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setLoadingTrackIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(trackId)
        return newSet
      })
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır')
      return
    }

    setIsUploadingCover(true)
    try {
      const updatedPlaylist = await uploadPlaylistCover(playlistId, file)
      // Update the playlist in context
      await selectPlaylist(playlistId)
      toast.success('Kapak fotoğrafı başarıyla yüklendi')
    } catch (error) {
      console.error('Failed to upload cover:', error)
      toast.error('Kapak fotoğrafı yüklenirken hata oluştu')
    } finally {
      setIsUploadingCover(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-32" />
          <div className="h-20 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!selectedPlaylist) {
    return (
      <div className="p-8">
        <Button onClick={() => router.back()} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <p className="text-muted-foreground mt-4">Playlist not found</p>
      </div>
    )
  }

  const playlistTracks = selectedPlaylist.tracks || []

  return (
    <div className="flex w-full h-screen">
      <Sidebar className="hidden lg:flex w-64 shrink-0 fixed left-0 top-0 bottom-24 z-40" />
      <div className="w-full lg:ml-64 flex flex-col bg-background h-full">
        {/* Navbar */}
        <div className="flex-shrink-0">
          <Navbar />
        </div>
        
        {/* Header */}
        <div className="border-b p-4 flex-shrink-0">
        <Button 
          onClick={() => router.back()} 
          variant="ghost" 
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
      </div>

      {/* Main Content - No scroll here */}
      <div className="flex-1 w-full">
        <div className="w-full px-4 sm:px-6 md:px-8 py-8">
          <div className="w-full mx-auto">
          {/* Playlist Header with Cover */}
          <div className="flex gap-4 sm:gap-8 mb-8 sm:mb-12 items-start flex-col sm:flex-row">
            {/* Cover Image */}
            <div className="flex-shrink-0 relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={isUploadingCover}
              />
              <div className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 aspect-square bg-primary rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:shadow-lg">
                {selectedPlaylist.cover_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={selectedPlaylist.cover_url} 
                    alt={selectedPlaylist.title}
                    className="w-full h-full object-cover rounded-lg aspect-square"
                  />
                ) : (
                  <Music className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24 text-white opacity-50" />
                )}
                
                {/* Upload Overlay */}
                <div 
                  className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => !isUploadingCover && fileInputRef.current?.click()}
                >
                  {isUploadingCover ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Playlist Info */}
            <div className="flex-1 flex flex-col justify-end min-w-0 w-full sm:w-auto">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">PLAYLIST</p>
                
                {isEditingTitle ? (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTitle()
                        if (e.key === 'Escape') {
                          setIsEditingTitle(false)
                          setEditTitle('')
                        }
                      }}
                      autoFocus
                      placeholder="Playlist name"
                      className="text-4xl font-bold h-auto py-2"
                    />
                    <Button size="sm" onClick={handleUpdateTitle}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingTitle(false)
                        setEditTitle('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 break-words">{selectedPlaylist.title}</h1>
                )}

                <p className="text-lg text-muted-foreground mb-6">
                  {playlistTracks.length} {playlistTracks.length === 1 ? 'song' : 'songs'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => playlistTracks.length > 0 && playTrack(playlistTracks[0], playlistTracks.slice(1))}
                  disabled={playlistTracks.length === 0}
                  title="Play playlist"
                >
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  Play
                </Button>

                <Button onClick={() => setShowAddTracks(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Song
                </Button>

                <div className="relative">
                  <Button
                    onClick={() => setShowEditMenu(!showEditMenu)}
                    variant="outline"
                    size="lg"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>

                  {showEditMenu && (
                    <div className="absolute left-0 mt-2 w-48 bg-popover border rounded-md shadow-md z-10">
                      <button
                        onClick={() => {
                          setEditTitle(selectedPlaylist.title)
                          setIsEditingTitle(true)
                          setShowEditMenu(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted rounded-t-md text-sm"
                      >
                        Rename
                      </button>
                      <div className="border-t" />
                      <button
                        onClick={() => {
                          setShowEditMenu(false)
                          handleDeletePlaylist()
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-destructive/10 text-destructive rounded-b-md text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tracks List */}
          {playlistTracks.length > 0 ? (
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-6 flex-shrink-0">Songs ({playlistTracks.length})</h2>
              <div className="space-y-2 overflow-y-auto flex-1">
                {playlistTracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id
                  return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-4 rounded-lg transition-colors group ${
                      isCurrentTrack 
                        ? 'bg-primary/20 hover:bg-primary/25' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className={`w-8 text-right flex-shrink-0 ${
                      isCurrentTrack 
                        ? 'text-primary font-semibold' 
                        : 'text-muted-foreground'
                    }`}>
                      {isCurrentTrack && isPlaying ? (
                        <span className="flex gap-0.5 justify-end">
                          <span className="w-0.5 h-3 bg-primary animate-pulse" />
                          <span className="w-0.5 h-3 bg-primary animate-pulse delay-75" />
                          <span className="w-0.5 h-3 bg-primary animate-pulse delay-150" />
                        </span>
                      ) : (
                        index + 1
                      )}
                    </span>
                    
                    {/* Play Button - Always Visible */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => playTrack(track, playlistTracks)}
                      title="Play track"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        isCurrentTrack ? 'text-primary' : ''
                      }`}>
                        {track.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist_name || 'Unknown Artist'}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="text-sm text-muted-foreground flex-shrink-0">
                      {track.duration
                        ? `${Math.floor((track.duration || 0) / 60)}:${String((track.duration || 0) % 60).padStart(2, '0')}`
                        : '-'}
                    </div>

                    {/* Heart Button - Add to Favorites */}
                    <Button
                      onClick={(e) => handleToggleFavorite(e, track.id)}
                      disabled={loadingTrackIds.has(track.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title={likedTracks.has(track.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          likedTracks.has(track.id)
                            ? 'fill-green-500 stroke-green-500 text-green-500'
                            : 'stroke-current'
                        }`}
                      />
                    </Button>

                    {/* Remove Button - Delete from Playlist */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => handleRemoveTrack(track.id)}
                      title="Remove from playlist"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
              <Music className="h-16 w-16 text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No songs in this playlist</h3>
                <p className="text-muted-foreground mb-6">
                  Add a song to get started
                </p>
              </div>
              <Button onClick={() => setShowAddTracks(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Song
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Add Tracks Modal */}
      {showAddTracks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Add Track</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAddTracks(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search for songs..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              <ScrollArea className="flex-1 border rounded-md">
                <div className="space-y-2 p-4">
                  {isSearching ? (
                    <div className="text-center text-muted-foreground">
                      Searching...
                    </div>
                  ) : searchQuery.trim() ? (
                    searchResults.length > 0 ? (
                      searchResults.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{track.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {track.artist_name || 'Unknown'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddTrack(track.id)}
                            disabled={addingTrackId === track.id}
                            className="ml-2 whitespace-nowrap"
                          >
                            {addingTrackId === track.id ? 'Adding...' : 'Add'}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No tracks found
                      </div>
                    )
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Start typing to search
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}

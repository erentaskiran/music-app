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
  Play
} from 'lucide-react'
import { searchTracks } from '@/lib/api'
import type { Track } from '@/lib/types'

export default function PlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = parseInt(params.id as string)
  
  const { selectedPlaylist, selectPlaylist, updatePlaylist, deletePlaylist, removeTrackFromPlaylist, addTrackToPlaylist } = usePlaylist()
  const { playTrack } = usePlayer()
  const [isLoading, setIsLoading] = useState(true)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showAddTracks, setShowAddTracks] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingTrackId, setAddingTrackId] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
            <div className="flex-shrink-0">
              <div className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
                {selectedPlaylist.cover_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={selectedPlaylist.cover_url} 
                    alt={selectedPlaylist.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Music className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24 text-white opacity-50" />
                )}
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
                      Kaydet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingTitle(false)
                        setEditTitle('')
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                ) : (
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 break-words">{selectedPlaylist.title}</h1>
                )}

                <p className="text-lg text-muted-foreground mb-6">
                  {playlistTracks.length} {playlistTracks.length === 1 ? 'şarkı' : 'şarkı'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button onClick={() => setShowAddTracks(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Şarkı Ekle
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
                        Yeniden Adlandır
                      </button>
                      <div className="border-t" />
                      <button
                        onClick={() => {
                          setShowEditMenu(false)
                          handleDeletePlaylist()
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-destructive/10 text-destructive rounded-b-md text-sm"
                      >
                        Sil
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
              <h2 className="text-2xl font-bold mb-6 flex-shrink-0">Şarkılar ({playlistTracks.length})</h2>
              <div className="space-y-2 overflow-y-auto flex-1">
                {playlistTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-muted-foreground w-8 text-right">{index + 1}</span>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => playTrack(track, playlistTracks)}
                    >
                      <Play className="h-5 w-5 fill-current" />
                    </Button>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist_name || 'Bilinmeyen Sanatçı'}
                      </p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {track.duration
                        ? `${Math.floor((track.duration || 0) / 60)}:${String((track.duration || 0) % 60).padStart(2, '0')}`
                        : '-'}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveTrack(track.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
              <Music className="h-16 w-16 text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Bu çalma listesinde şarkı yok</h3>
                <p className="text-muted-foreground mb-6">
                  Başlamak için şarkı ekleyin
                </p>
              </div>
              <Button onClick={() => setShowAddTracks(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Şarkı Ekle
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

"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Disc, Image as ImageIcon, Search, Plus, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createAlbum, makeRequest } from "@/lib/api"

interface Track {
  id: number
  title: string
  artist_name: string
}

export default function CreateAlbumPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [albumName, setAlbumName] = useState("")
  const [artistName, setArtistName] = useState("")
  const [releaseYear, setReleaseYear] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSearchTracks = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      try {
        const results = await makeRequest(`/search?q=${encodeURIComponent(query)}`)
        setSearchResults(results)
      } catch (error) {
        console.error("Search failed", error)
      }
    } else {
      setSearchResults([])
    }
  }

  const handleAddTrack = (track: Track) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      setSelectedTracks([...selectedTracks, track])
    }
    setSearchQuery("")
    setSearchResults([])
  }

  const handleRemoveTrack = (trackId: number) => {
    setSelectedTracks(selectedTracks.filter(t => t.id !== trackId))
  }

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/")) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      toast.error("Please select a valid image file")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!albumName || !artistName) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("title", albumName)
      formData.append("artist_name", artistName)
      if (releaseYear) formData.append("release_year", releaseYear)
      if (selectedImage) formData.append("cover_image", selectedImage)
      if (selectedTracks.length > 0) {
        formData.append("track_ids", selectedTracks.map(t => t.id).join(","))
      }

      await createAlbum(formData)
      
      toast.success("Album created successfully!")
      router.push("/admin/albums") // Redirect to albums list
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create album")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle>Create New Album</CardTitle>
          <CardDescription>
            Add a new album to the library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Art Upload */}
            <div className="space-y-2">
              <Label>Cover Art</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0])
                    }
                  }}
                />
                
                {imagePreview ? (
                  <div className="relative w-48 h-48 mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imagePreview} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover rounded-md shadow-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage(null)
                        setImagePreview(null)
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 cursor-pointer">
                    <div className="p-4 rounded-full bg-gray-800">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-sm text-gray-400">
                      <span className="text-purple-500 font-medium">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or WEBP (max. 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Album Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="albumName">Album Name</Label>
                <Input
                  id="albumName"
                  placeholder="e.g. Nevermind"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  id="artistName"
                  placeholder="e.g. Nirvana"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="bg-gray-800/50 border-gray-700"
                />
                <p className="text-xs text-gray-500">Must match an existing user username</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseYear">Release Year</Label>
                <Input
                  id="releaseYear"
                  type="number"
                  placeholder="e.g. 1991"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>

              {/* Track Selection */}
              <div className="space-y-2">
                <Label>Add Tracks</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tracks to add..."
                    value={searchQuery}
                    onChange={(e) => handleSearchTracks(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      {searchResults.map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center justify-between"
                          onClick={() => handleAddTrack(track)}
                        >
                          <span className="truncate">{track.title} - {track.artist_name}</span>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Tracks List */}
                {selectedTracks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-xs text-gray-400">Selected Tracks</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {selectedTracks.map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-2 rounded bg-gray-800/30 border border-gray-800"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                            <span className="truncate text-sm">{track.title}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-red-400"
                            onClick={() => handleRemoveTrack(track.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={isUploading}
            >
              {isUploading ? (
                <>Creating...</>
              ) : (
                <>
                  <Disc className="w-4 h-4 mr-2" />
                  Create Album
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

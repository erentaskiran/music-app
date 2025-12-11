"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Upload, Music, File, CheckCircle2, Image as ImageIcon, User, Disc } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { withAuth } from "@/lib/auth"
import { makeAuthenticatedRequest } from "@/lib/api"

interface Album {
  id: number
  title: string
  cover_url?: string
}

interface User {
  id: number
  username: string
}

function MusicUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCover, setSelectedCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [musicTitle, setMusicTitle] = useState("")
  const [genre, setGenre] = useState("")
  const [duration, setDuration] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingCover, setIsDraggingCover] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  
  const [albums, setAlbums] = useState<Album[]>([])
  const [artists, setArtists] = useState<User[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<string>("")
  const [selectedArtist, setSelectedArtist] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [albumsData, usersData] = await Promise.all([
          makeAuthenticatedRequest("/albums"),
          makeAuthenticatedRequest("/users")
        ])
        setAlbums(albumsData)
        setArtists(usersData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load albums and artists")
      }
    }
    fetchData()
  }, [])

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.addEventListener("loadedmetadata", () => {
        resolve(Math.round(audio.duration))
        URL.revokeObjectURL(audio.src)
      })
      audio.addEventListener("error", () => {
        resolve(0)
        URL.revokeObjectURL(audio.src)
      })
      audio.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    const validTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp3"]
    const validExtensions = [".mp3", ".wav", ".flac"]
    
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )
    
    if (validTypes.includes(file.type) || hasValidExtension) {
      setSelectedFile(file)
      setUploadSuccess(false)
      
      // Get audio duration
      const audioDuration = await getAudioDuration(file)
      setDuration(audioDuration)
      
      // Auto-fill title with filename (without extension)
      if (!musicTitle) {
        setMusicTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    } else {
      toast.error("Please select a valid audio file (mp3, wav, or flac)")
    }
  }

  const handleCoverSelect = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
            // Optional: Check dimensions here if needed, e.g. if (img.width < 500) ...
            setSelectedCover(file)
            setCoverPreview(reader.result as string)
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    } else {
      toast.error("Please select a valid image file")
    }
  }

  const handleDragOver = (e: React.DragEvent, setDragging: (v: boolean) => void) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent, setDragging: (v: boolean) => void) => {
    e.preventDefault()
    setDragging(false)
  }

  const handleDrop = (e: React.DragEvent, type: 'audio' | 'cover') => {
    e.preventDefault()
    if (type === 'audio') setIsDragging(false)
    else setIsDraggingCover(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      if (type === 'audio') handleFileSelect(file)
      else handleCoverSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'audio') handleFileSelect(file)
      else handleCoverSelect(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleUpload = async () => {
    if (!selectedFile || !musicTitle.trim()) {
      toast.error("Please select a file and enter a title")
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("title", musicTitle)
      formData.append("genre", genre)
      if (duration > 0) {
        formData.append("duration", duration.toString())
      }
      if (selectedCover) {
        formData.append("cover_image", selectedCover)
      }
      if (selectedAlbum) {
        formData.append("album_id", selectedAlbum)
      }
      if (selectedArtist) {
        formData.append("artist_id", selectedArtist)
      }

      await makeAuthenticatedRequest("/tracks/upload", {
        method: "POST",
        body: formData,
      })

      setIsUploading(false)
      setUploadSuccess(true)
      
      toast.success("Music uploaded successfully!", {
        description: `"${musicTitle}" has been added to your library`,
      })

      // Reset form after 2 seconds
      setTimeout(() => {
        setSelectedFile(null)
        setSelectedCover(null)
        setCoverPreview(null)
        setMusicTitle("")
        setGenre("")
        setDuration(0)
        setSelectedAlbum("")
        setSelectedArtist("")
        setUploadSuccess(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (coverInputRef.current) coverInputRef.current.value = ""
      }, 2000)
    } catch (error) {
      console.error(error)
      setIsUploading(false)
      toast.error("Failed to upload music")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              Upload Music
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload your music files to the streaming platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label className="text-foreground">Music File *</Label>
                <div
                  onDragOver={(e) => handleDragOver(e, setIsDragging)}
                  onDragLeave={(e) => handleDragLeave(e, setIsDragging)}
                  onDrop={(e) => handleDrop(e, 'audio')}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer h-48 flex flex-col items-center justify-center
                    ${isDragging 
                      ? "border-primary bg-primary/10" 
                      : "border-input hover:border-ring bg-muted/50"
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
                    onChange={(e) => handleFileInputChange(e, 'audio')}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Music className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground font-medium text-sm">
                        {selectedFile ? selectedFile.name : "Click to upload audio"}
                      </p>
                      {!selectedFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          MP3, WAV, FLAC
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Image Upload Area */}
              <div className="space-y-2">
                <Label className="text-foreground">Cover Image (Optional)</Label>
                <div
                  onDragOver={(e) => handleDragOver(e, setIsDraggingCover)}
                  onDragLeave={(e) => handleDragLeave(e, setIsDraggingCover)}
                  onDrop={(e) => handleDrop(e, 'cover')}
                  onClick={() => coverInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer h-48 flex flex-col items-center justify-center relative overflow-hidden
                    ${isDraggingCover 
                      ? "border-primary bg-primary/10" 
                      : "border-input hover:border-ring bg-muted/50"
                    }
                  `}
                >
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileInputChange(e, 'cover')}
                    className="hidden"
                  />
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover opacity-50 hover:opacity-40 transition-opacity" />
                  ) : null}
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className="p-3 rounded-full bg-primary/10">
                      <ImageIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground font-medium text-sm">
                        {selectedCover ? "Change Cover" : "Click to upload cover"}
                      </p>
                      {!selectedCover && (
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <File className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{formatFileSize(selectedFile.size)}</span>
                      {duration > 0 && (
                        <>
                          <span>•</span>
                          <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {uploadSuccess && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}

            {/* Form Fields */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">
                  Music Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Enter music title"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  className="bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre" className="text-foreground">
                  Genre (Optional)
                </Label>
                <Input
                  id="genre"
                  placeholder="Enter genre (e.g. Pop, Rock)"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist" className="text-foreground">
                  Artist (Optional)
                </Label>
                <div className="relative">
                  <select
                    id="artist"
                    value={selectedArtist}
                    onChange={(e) => setSelectedArtist(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-muted/50 border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="">Select Artist (Default: You)</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.username}
                      </option>
                    ))}
                  </select>
                  <User className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="album" className="text-foreground">
                  Album (Optional)
                </Label>
                <div className="relative">
                  <select
                    id="album"
                    value={selectedAlbum}
                    onChange={(e) => setSelectedAlbum(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-muted/50 border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="">Select Album (None)</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>
                  <Disc className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !musicTitle.trim() || isUploading || uploadSuccess}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-bounce" />
                  Uploading...
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Upload Complete
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Music
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Supported formats: MP3, WAV, FLAC</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Maximum file size: 100MB</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Recommended bitrate: 320kbps for MP3</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Ensure you have the rights to upload the music</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(MusicUploadPage)

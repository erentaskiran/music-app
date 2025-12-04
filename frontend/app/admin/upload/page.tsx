"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload, Music, File, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { withAuth } from "@/lib/auth"
import { makeAuthenticatedRequest } from "@/lib/api"

function MusicUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [musicTitle, setMusicTitle] = useState("")
  const [genre, setGenre] = useState("")
  const [duration, setDuration] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
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
        setMusicTitle("")
        setGenre("")
        setDuration(0)
        setUploadSuccess(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
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
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Upload className="w-6 h-6" />
              </div>
              Upload Music
            </CardTitle>
            <CardDescription className="text-gray-400">
              Upload your music files to the streaming platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-2">
              <Label className="text-gray-200">Music File</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? "border-purple-500 bg-purple-500/10" 
                    : "border-gray-700 hover:border-gray-600 bg-[#1a1a1a]"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Music className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      MP3, WAV, or FLAC (Max 100MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <File className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
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

            {/* Music Title Input */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-200">
                  Music Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Enter music title"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre" className="text-gray-200">
                  Genre (Optional)
                </Label>
                <Input
                  id="genre"
                  placeholder="Enter genre (e.g. Pop, Rock)"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !musicTitle.trim() || isUploading || uploadSuccess}
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
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
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Supported formats: MP3, WAV, FLAC</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Maximum file size: 100MB</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Recommended bitrate: 320kbps for MP3</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
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

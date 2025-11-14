"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Music, MoreVertical, Pencil, Trash2, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface MusicTrack {
  id: string
  title: string
  artist: string
  fileSize: string
  uploadDate: string
  status: "active" | "processing"
}

const initialTracks: MusicTrack[] = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Rose",
    fileSize: "8.5 MB",
    uploadDate: "2024-11-14",
    status: "active",
  },
  {
    id: "2",
    title: "Electric Pulse",
    artist: "Neon Beats",
    fileSize: "12.3 MB",
    uploadDate: "2024-11-13",
    status: "active",
  },
  {
    id: "3",
    title: "Ocean Waves",
    artist: "Calm Collective",
    fileSize: "15.7 MB",
    uploadDate: "2024-11-12",
    status: "active",
  },
  {
    id: "4",
    title: "Summer Vibes",
    artist: "DJ Maxwell",
    fileSize: "10.2 MB",
    uploadDate: "2024-11-12",
    status: "active",
  },
  {
    id: "5",
    title: "City Lights",
    artist: "Urban Symphony",
    fileSize: "9.8 MB",
    uploadDate: "2024-11-11",
    status: "active",
  },
  {
    id: "6",
    title: "Desert Storm",
    artist: "The Wanderers",
    fileSize: "11.5 MB",
    uploadDate: "2024-11-10",
    status: "active",
  },
  {
    id: "7",
    title: "Neon Nights",
    artist: "Cyber Dreams",
    fileSize: "13.2 MB",
    uploadDate: "2024-11-09",
    status: "active",
  },
  {
    id: "8",
    title: "Cosmic Journey",
    artist: "Stellar Sounds",
    fileSize: "14.8 MB",
    uploadDate: "2024-11-08",
    status: "processing",
  },
]

export default function MusicLibraryPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (id: string) => {
    setTracks(tracks.filter((track) => track.id !== id))
    toast.success("Track deleted successfully")
  }

  const handleEdit = (id: string) => {
    toast.info("Edit functionality coming soon")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Music className="w-6 h-6" />
                </div>
                Music Library
              </CardTitle>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search music or artist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Cover</TableHead>
                    <TableHead className="text-gray-400">Title</TableHead>
                    <TableHead className="text-gray-400">Artist</TableHead>
                    <TableHead className="text-gray-400">File Size</TableHead>
                    <TableHead className="text-gray-400">Uploaded</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTracks.map((track, index) => (
                    <motion.tr
                      key={track.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-gray-800 hover:bg-gray-800/50 transition-colors duration-200"
                    >
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">{track.title}</TableCell>
                      <TableCell className="text-gray-400">{track.artist}</TableCell>
                      <TableCell className="text-gray-400">{track.fileSize}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(track.uploadDate)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            track.status === "active"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }
                        >
                          {track.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(track.id)}
                            className="hover:bg-gray-700"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(track.id)}
                            className="hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredTracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-[#1a1a1a] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Music className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{track.title}</h3>
                          <p className="text-sm text-gray-400">{track.artist}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{track.fileSize}</span>
                            <span>•</span>
                            <span>{formatDate(track.uploadDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge
                              className={
                                track.status === "active"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              {track.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(track.id)}
                            className="hover:bg-gray-700 h-8 w-8"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(track.id)}
                            className="hover:bg-red-500/20 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredTracks.length === 0 && (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No music tracks found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-400">Total Tracks</p>
                <p className="text-2xl font-bold text-white mt-1">{tracks.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {tracks.filter((t) => t.status === "active").length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Processing</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {tracks.filter((t) => t.status === "processing").length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Size</p>
                <p className="text-2xl font-bold text-white mt-1">89.2 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Music, Pencil, Trash2, Search, Plus, Loader2, Upload, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { withAuth } from "@/lib/auth"
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
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { getMyTracks, deleteTrack, updateTrack, TrackResponse, UpdateTrackData } from "@/lib/api"

interface MusicTrack {
  id: number
  title: string
  artist: string
  duration: number
  uploadDate: string
  status: "active" | "processing"
  coverImageUrl?: string
  genre?: string
}

function MusicLibraryPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<MusicTrack | null>(null)
  const [editForm, setEditForm] = useState({ title: "", genre: "" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchTracks()
  }, [])

  async function fetchTracks() {
    try {
      setIsLoading(true)
      const response = await getMyTracks()
      const mappedTracks: MusicTrack[] = response.map((track: TrackResponse) => ({
        id: track.id,
        title: track.title,
        artist: track.artist_name,
        duration: track.duration || 0,
        uploadDate: track.created_at,
        status: track.status === "published" ? "active" : "processing",
        coverImageUrl: track.cover_image_url,
        genre: track.genre || "",
      }))
      setTracks(mappedTracks)
    } catch (error) {
      console.error("Failed to fetch tracks:", error)
      toast.error("Failed to load your tracks")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteClick = (track: MusicTrack) => {
    setTrackToDelete(track)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!trackToDelete) return

    try {
      setIsDeleting(trackToDelete.id)
      await deleteTrack(trackToDelete.id)
      setTracks(tracks.filter((track) => track.id !== trackToDelete.id))
      toast.success("Track deleted successfully")
    } catch (error) {
      console.error("Failed to delete track:", error)
      toast.error("Failed to delete track")
    } finally {
      setIsDeleting(null)
      setIsDeleteDialogOpen(false)
      setTrackToDelete(null)
    }
  }

  const handleEditClick = (track: MusicTrack) => {
    setEditingTrack(track)
    setEditForm({ title: track.title, genre: track.genre || "" })
    setIsEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingTrack || !editForm.title.trim()) {
      toast.error("Title is required")
      return
    }

    try {
      setIsSaving(true)
      const updateData: UpdateTrackData = {
        title: editForm.title.trim(),
        genre: editForm.genre.trim() || null,
      }
      await updateTrack(editingTrack.id, updateData)
      
      // Update local state
      setTracks(tracks.map(track => 
        track.id === editingTrack.id 
          ? { ...track, title: editForm.title.trim(), genre: editForm.genre.trim() }
          : track
      ))
      
      toast.success("Track updated successfully")
      setIsEditDialogOpen(false)
      setEditingTrack(null)
    } catch (error) {
      console.error("Failed to update track:", error)
      toast.error("Failed to update track")
    } finally {
      setIsSaving(false)
    }
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
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
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search music or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:ring-purple-500/50"
                  />
                </div>
                <Link href="/admin/albums/create">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Album
                  </Button>
                </Link>
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
                    <TableHead className="text-gray-400">Duration</TableHead>
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
                        {track.coverImageUrl ? (
                          <img
                            src={track.coverImageUrl}
                            alt={track.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Music className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-white">{track.title}</TableCell>
                      <TableCell className="text-gray-400">{track.artist}</TableCell>
                      <TableCell className="text-gray-400">{formatDuration(track.duration)}</TableCell>
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
                            onClick={() => handleEditClick(track)}
                            className="hover:bg-gray-700"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(track)}
                            disabled={isDeleting === track.id}
                            className="hover:bg-red-500/20"
                          >
                            {isDeleting === track.id ? (
                              <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
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
                        {track.coverImageUrl ? (
                          <img
                            src={track.coverImageUrl}
                            alt={track.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Music className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{track.title}</h3>
                          <p className="text-sm text-gray-400">{track.artist}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{formatDuration(track.duration)}</span>
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
                            onClick={() => handleEditClick(track)}
                            className="hover:bg-gray-700 h-8 w-8"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(track)}
                            disabled={isDeleting === track.id}
                            className="hover:bg-red-500/20 h-8 w-8"
                          >
                            {isDeleting === track.id ? (
                              <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredTracks.length === 0 && tracks.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No tracks uploaded yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Start building your music library by uploading your first track. You can manage all your music from here.
                </p>
                <Link href="/admin/upload">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Track
                  </Button>
                </Link>
              </div>
            )}

            {filteredTracks.length === 0 && tracks.length > 0 && searchQuery && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No results found</h3>
                <p className="text-gray-400">
                  No tracks match "{searchQuery}". Try a different search term.
                </p>
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
                <p className="text-sm text-gray-400">Total Duration</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatDuration(tracks.reduce((acc, t) => acc + t.duration, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Track Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Track</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the details of your track. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white"
                placeholder="Track title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre" className="text-gray-300">Genre</Label>
              <Input
                id="genre"
                value={editForm.genre}
                onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white"
                placeholder="Genre (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={isSaving || !editForm.title.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-400">Delete Track</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{trackToDelete?.title}"? This action cannot be undone and the audio file will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting !== null}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              {isDeleting !== null ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Track
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(MusicLibraryPage)

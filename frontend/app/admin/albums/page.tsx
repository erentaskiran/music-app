"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Disc, Plus, Search, Calendar, User, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getAlbums, deleteAlbum } from "@/lib/api"
import { toast } from "sonner"

interface Album {
  id: number
  title: string
  artist_name: string
  cover_url?: string
  release_date?: string
  created_at: string
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAlbums()
  }, [])

  const loadAlbums = async () => {
    try {
      const data = await getAlbums()
      setAlbums(data)
    } catch {
      toast.error("Failed to load albums")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm("Are you sure you want to delete this album? This action cannot be undone.")) {
      try {
        await deleteAlbum(id)
        toast.success("Album deleted successfully")
        loadAlbums()
      } catch {
        toast.error("Failed to delete album")
      }
    }
  }

  const filteredAlbums = albums.filter(
    (album) =>
      album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-2xl text-foreground flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Disc className="w-6 h-6 text-primary" />
                </div>
                Albums
              </CardTitle>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:ring-primary/50"
                  />
                </div>
                <Link href="/admin/albums/create">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Album
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAlbums.map((album) => (
                <Link key={album.id} href={`/admin/albums/${album.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="aspect-square relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={album.cover_url || "/placeholder.svg"}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-lg"
                          onClick={(e) => handleDelete(e, album.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" className="rounded-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg text-foreground truncate">{album.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <User className="w-4 h-4" />
                        <span className="truncate">{album.artist_name}</span>
                      </div>
                      {album.release_date && (
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(album.release_date).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
            {filteredAlbums.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                No albums found. Create one to get started!
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

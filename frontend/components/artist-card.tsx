import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ProfileResponse } from "@/lib/api"
import { ArtistWithStats } from "@/lib/types"
import { Music, Disc } from "lucide-react"

interface ArtistCardProps {
  artist: ProfileResponse | ArtistWithStats
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const isArtistWithStats = (a: ProfileResponse | ArtistWithStats): a is ArtistWithStats => {
    return 'total_tracks' in a
  }

  const showStats = isArtistWithStats(artist)

  return (
    <Link href={`/artist/${artist.id}`} className="block group">
      <Card className="bg-card/50 border-0 hover:bg-accent/50 transition-colors">
        <CardContent className="p-4 flex flex-col items-center text-center gap-4">
          <Avatar className="w-32 h-32 rounded-full shadow-lg group-hover:scale-105 transition-transform">
            <AvatarImage src={artist.avatar_url} alt={artist.username} className="object-cover" />
            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
              {artist.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 w-full">
            <h3 className="font-semibold text-lg truncate max-w-[180px] mx-auto" title={artist.username}>
              {artist.username}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {'role' in artist && artist.role === 'user' ? 'Artist' : 'role' in artist ? artist.role : 'Artist'}
            </p>
            {showStats && (artist.total_tracks > 0 || artist.total_albums > 0) && (
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
                {artist.total_tracks > 0 && (
                  <span className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    {artist.total_tracks}
                  </span>
                )}
                {artist.total_albums > 0 && (
                  <span className="flex items-center gap-1">
                    <Disc className="h-3 w-3" />
                    {artist.total_albums}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

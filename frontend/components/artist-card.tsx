import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ProfileResponse } from "@/lib/api"

interface ArtistCardProps {
  artist: ProfileResponse
}

export function ArtistCard({ artist }: ArtistCardProps) {
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
          <div className="space-y-1">
            <h3 className="font-semibold text-lg truncate max-w-[180px]" title={artist.username}>
              {artist.username}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {artist.role === 'user' ? 'Artist' : artist.role}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

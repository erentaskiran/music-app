import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { AlbumCard } from '@/components/album-card'
import { featuredAlbums } from '@/lib/data'
import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function FeaturedAlbums() {
  return (
    <section className="mb-8">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-chart-4" />
            Featured Albums
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {featuredAlbums.map((album) => (
                <div key={album.id} className="w-[180px] md:w-[200px]">
                  <AlbumCard album={album} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  )
}

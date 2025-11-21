import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { AlbumCard } from '@/components/album-card'
import { featuredAlbums } from '@/lib/data'

export function FeaturedAlbums() {
  return (
    <section className="mb-12">
      <h2 className="mb-6 text-2xl font-bold md:text-3xl">Featured Albums</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {featuredAlbums.map((album) => (
            <div key={album.id} className="w-[200px] md:w-[240px]">
              <AlbumCard album={album} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

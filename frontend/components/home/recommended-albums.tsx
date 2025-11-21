import { AlbumCard } from '@/components/album-card'
import { recommendedAlbums } from '@/lib/data'

export function RecommendedAlbums() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold md:text-3xl">Recommended for You</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {recommendedAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </section>
  )
}

import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Music } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0c]/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-white md:h-8 md:w-8" />
          <span className="hidden text-xl font-bold md:inline">Musicly</span>
        </div>

        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search for albums, artists..."
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:ring-white/20"
          />
        </div>

        <Avatar className="h-9 w-9 md:h-10 md:w-10">
          <AvatarImage src="/diverse-user-avatars.png" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  )
}

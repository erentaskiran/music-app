export type UserRole = 'user' | 'admin'

export interface User {
  id: number
  email: string
  username: string
  avatar_url?: string
  role: UserRole
}

export interface JWTPayload {
  userId: number
  email: string
  role: UserRole
  sub: string
  iss: string
  aud: string[]
  iat: number
  exp: number
  nbf: number
}

export interface Track {
  id: number
  title: string
  artist_id: number
  artist_name?: string
  file_url: string
  duration?: number
  cover_image_url?: string
  genre?: string
  lyrics?: string
  quality_bitrate?: number
  status: string
  created_at: string
  updated_at: string
  is_favorited?: boolean
}

export interface Playlist {
  id: number
  title: string
  creator_id: number
  cover_url?: string
  privacy: string
  created_at: string
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[]
}

export interface Album {
  id: number
  title: string
  artist_id: number
  artist_name?: string
  cover_url?: string
  release_date?: string
  created_at: string
}

export interface AlbumWithTracks extends Album {
  tracks: Track[]
}

export interface Artist {
  id: number
  username: string
  email: string
  avatar_url?: string
  bio?: string
  role: string
  created_at: string
}

export interface ArtistDetails extends Artist {
  total_tracks: number
  total_albums: number
  total_listens: number
}

export interface ArtistWithStats {
  id: number
  username: string
  avatar_url?: string
  bio?: string
  total_tracks: number
  total_albums: number
  total_listens: number
}

export interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
}

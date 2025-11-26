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

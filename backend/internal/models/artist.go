package models

import "time"

// Artist represents an artist profile (user with artist content)
type Artist struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
	Bio       *string   `json:"bio,omitempty"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// ArtistDetails includes full artist information with stats
type ArtistDetails struct {
	Artist
	TotalTracks  int `json:"total_tracks"`
	TotalAlbums  int `json:"total_albums"`
	TotalListens int `json:"total_listens"`
}

// ArtistWithStats represents an artist with basic statistics
type ArtistWithStats struct {
	ID           int     `json:"id"`
	Username     string  `json:"username"`
	AvatarURL    *string `json:"avatar_url,omitempty"`
	Bio          *string `json:"bio,omitempty"`
	TotalTracks  int     `json:"total_tracks"`
	TotalAlbums  int     `json:"total_albums"`
	TotalListens int     `json:"total_listens"`
}

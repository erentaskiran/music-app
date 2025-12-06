package models

import "time"

type Track struct {
	ID             int       `json:"id"`
	Title          string    `json:"title"`
	ArtistID       int       `json:"artist_id"`
	FileURL        string    `json:"file_url"`
	Duration       int       `json:"duration,omitempty"`
	CoverImageURL  *string   `json:"cover_image_url,omitempty"`
	Genre          *string   `json:"genre,omitempty"`
	Lyrics         *string   `json:"lyrics,omitempty"`
	QualityBitrate *int      `json:"quality_bitrate,omitempty"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	IsFavorited    bool      `json:"is_favorited,omitempty"`
}

// TrackWithArtist includes artist information along with track data
type TrackWithArtist struct {
	ID             int       `json:"id"`
	Title          string    `json:"title"`
	ArtistID       int       `json:"artist_id"`
	ArtistName     string    `json:"artist_name"`
	FileURL        string    `json:"file_url"`
	Duration       int       `json:"duration,omitempty"`
	CoverImageURL  *string   `json:"cover_image_url,omitempty"`
	Genre          *string   `json:"genre,omitempty"`
	Lyrics         *string   `json:"lyrics,omitempty"`
	QualityBitrate *int      `json:"quality_bitrate,omitempty"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	IsFavorited    bool      `json:"is_favorited,omitempty"`
}

type CreateTrackRequest struct {
	Title         string `json:"title"`
	FileURL       string `json:"file_url"`
	Duration      int    `json:"duration,omitempty"`
	CoverImageURL string `json:"cover_image_url,omitempty"`
	Genre         string `json:"genre,omitempty"`
}

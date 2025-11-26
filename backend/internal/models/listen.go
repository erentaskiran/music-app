package models

import "time"

// Listen represents a track play/listen event
type Listen struct {
	ID             int       `json:"id"`
	TrackID        int       `json:"track_id"`
	UserID         *int      `json:"user_id,omitempty"`
	Device         string    `json:"device,omitempty"`
	IP             string    `json:"ip,omitempty"`
	ListenDuration int       `json:"listen_duration,omitempty"`
	Timestamp      time.Time `json:"timestamp"`
}

// RecentlyPlayedTrack combines track info with play timestamp
type RecentlyPlayedTrack struct {
	ID            int       `json:"id"`
	Title         string    `json:"title"`
	ArtistID      int       `json:"artist_id"`
	ArtistName    string    `json:"artist_name"`
	FileURL       string    `json:"file_url"`
	Duration      int       `json:"duration,omitempty"`
	CoverImageURL string    `json:"cover_image_url,omitempty"`
	Genre         string    `json:"genre,omitempty"`
	Status        string    `json:"status"`
	PlayedAt      time.Time `json:"played_at"`
}

// RecordListenRequest is the request body for recording a listen
type RecordListenRequest struct {
	TrackID        int    `json:"track_id"`
	ListenDuration int    `json:"listen_duration,omitempty"`
	Device         string `json:"device,omitempty"`
}

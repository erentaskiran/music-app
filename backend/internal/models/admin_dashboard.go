package models

import "time"

type AdminDashboardStats struct {
	TotalTracks        int     `json:"total_tracks"`
	TotalTracksChange  float64 `json:"total_tracks_change"`
	TotalUploads       int     `json:"total_uploads"`
	TotalUploadsChange float64 `json:"total_uploads_change"`
	ActiveUsers        int     `json:"active_users"`
	ActiveUsersChange  float64 `json:"active_users_change"`
	StreamsToday       int     `json:"streams_today"`
	StreamsTodayChange float64 `json:"streams_today_change"`
}

type AdminRecentUpload struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	ArtistName string    `json:"artist_name"`
	CreatedAt  time.Time `json:"created_at"`
}

type AdminDashboardResponse struct {
	Stats         AdminDashboardStats `json:"stats"`
	RecentUploads []AdminRecentUpload `json:"recent_uploads"`
}

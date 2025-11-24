package repository

import (
	"music-app/backend/internal/models"
)

func (r *Repository) CreateTrack(track *models.Track) error {
	query := `
		INSERT INTO tracks (title, artist_id, file_url, duration, cover_image_url, genre, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'published')
		RETURNING id, created_at, updated_at
	`
	return r.Db.QueryRow(
		query,
		track.Title,
		track.ArtistID,
		track.FileURL,
		track.Duration,
		track.CoverImageURL,
		track.Genre,
	).Scan(&track.ID, &track.CreatedAt, &track.UpdatedAt)
}

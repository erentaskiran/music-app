package repository

import (
	"database/sql"
	"fmt"
	"log/slog"
	"music-app/backend/internal/models"
	"strings"
)

// GetTrackByID retrieves a track by its ID
func (r *Repository) GetTrackByID(id int) (*models.Track, error) {
	query := `
		SELECT id, title, artist_id, file_url, 
		       COALESCE(duration, 0), COALESCE(cover_image_url, ''), 
		       COALESCE(genre, ''), COALESCE(lyrics, ''), 
		       COALESCE(quality_bitrate, 0), COALESCE(status, 'published'), 
		       created_at, updated_at
		FROM tracks
		WHERE id = $1
	`
	track := &models.Track{}
	err := r.Db.QueryRow(query, id).Scan(
		&track.ID,
		&track.Title,
		&track.ArtistID,
		&track.FileURL,
		&track.Duration,
		&track.CoverImageURL,
		&track.Genre,
		&track.Lyrics,
		&track.QualityBitrate,
		&track.Status,
		&track.CreatedAt,
		&track.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return track, nil
}

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

// GetAllTracks retrieves all published tracks with artist information
func (r *Repository) GetAllTracks(limit, offset int) ([]models.TrackWithArtist, error) {
	query := `
		SELECT t.id, t.title, t.artist_id, t.file_url, 
		       COALESCE(t.duration, 0), COALESCE(t.cover_image_url, ''), 
		       COALESCE(t.genre, ''), COALESCE(t.lyrics, ''), 
		       COALESCE(t.quality_bitrate, 0), COALESCE(t.status, 'published'), 
		       t.created_at, t.updated_at,
		       u.username as artist_name
		FROM tracks t
		LEFT JOIN users u ON t.artist_id = u.id
		WHERE t.status = 'published'
		ORDER BY t.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.Db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&track.ArtistName,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}

	return tracks, nil
}

// GetAllTracksWithFavorites retrieves all published tracks with artist information and favorite status for a specific user
func (r *Repository) GetAllTracksWithFavorites(userID int, limit, offset int) ([]models.TrackWithArtist, error) {
	query := `
		SELECT t.id, t.title, t.artist_id, t.file_url, 
		       COALESCE(t.duration, 0), COALESCE(t.cover_image_url, ''), 
		       COALESCE(t.genre, ''), COALESCE(t.lyrics, ''), 
		       COALESCE(t.quality_bitrate, 0), COALESCE(t.status, 'published'), 
		       t.created_at, t.updated_at,
		       u.username as artist_name,
		       CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_favorited
		FROM tracks t
		LEFT JOIN users u ON t.artist_id = u.id
		LEFT JOIN likes l ON t.id = l.track_id AND l.user_id = $3
		WHERE t.status = 'published'
		ORDER BY t.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.Db.Query(query, limit, offset, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&track.ArtistName,
			&track.IsFavorited,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}

	return tracks, nil
}

// SearchTracks searches for tracks by title, artist name, or genre
func (r *Repository) SearchTracks(query string, limit, offset int) ([]models.TrackWithArtist, error) {
	sqlQuery := `
		SELECT t.id, t.title, t.artist_id, t.file_url, 
		       COALESCE(t.duration, 0), COALESCE(t.cover_image_url, ''), 
		       COALESCE(t.genre, ''), COALESCE(t.lyrics, ''), 
		       COALESCE(t.quality_bitrate, 0), COALESCE(t.status, 'published'), 
		       t.created_at, t.updated_at,
		       u.username as artist_name
		FROM tracks t
		LEFT JOIN users u ON t.artist_id = u.id
		WHERE t.status = 'published' AND (
			t.title ILIKE '%' || $1 || '%' OR 
			u.username ILIKE '%' || $1 || '%' OR
			t.genre ILIKE '%' || $1 || '%'
		)
		ORDER BY t.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.Db.Query(sqlQuery, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&track.ArtistName,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}
	return tracks, nil
}

// SearchTracksWithFavorites searches for tracks with favorite status for a specific user
func (r *Repository) SearchTracksWithFavorites(query string, userID int, limit, offset int) ([]models.TrackWithArtist, error) {
	sqlQuery := `
		SELECT t.id, t.title, t.artist_id, t.file_url, 
		       COALESCE(t.duration, 0), COALESCE(t.cover_image_url, ''), 
		       COALESCE(t.genre, ''), COALESCE(t.lyrics, ''), 
		       COALESCE(t.quality_bitrate, 0), COALESCE(t.status, 'published'), 
		       t.created_at, t.updated_at,
		       u.username as artist_name,
		       CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_favorited
		FROM tracks t
		LEFT JOIN users u ON t.artist_id = u.id
		LEFT JOIN likes l ON t.id = l.track_id AND l.user_id = $2
		WHERE t.status = 'published' AND (
			t.title ILIKE '%' || $1 || '%' OR 
			u.username ILIKE '%' || $1 || '%' OR
			t.genre ILIKE '%' || $1 || '%'
		)
		ORDER BY t.created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.Db.Query(sqlQuery, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&track.ArtistName,
			&track.IsFavorited,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}
	return tracks, nil
}

// GetTracksByArtistID retrieves all tracks uploaded by a specific artist
func (r *Repository) GetTracksByArtistID(artistID, limit, offset int) ([]models.TrackWithArtist, error) {
	query := `
		SELECT t.id, t.title, t.artist_id, t.file_url, 
		       COALESCE(t.duration, 0), COALESCE(t.cover_image_url, ''), 
		       COALESCE(t.genre, ''), COALESCE(t.lyrics, ''), 
		       COALESCE(t.quality_bitrate, 0), COALESCE(t.status, 'published'), 
		       t.created_at, t.updated_at,
		       u.username as artist_name
		FROM tracks t
		LEFT JOIN users u ON t.artist_id = u.id
		WHERE t.artist_id = $1
		ORDER BY t.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.Db.Query(query, artistID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&track.ArtistName,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}

	return tracks, nil
}

// UpdateTrack updates a track's details (title, genre, cover_image_url)
func (r *Repository) UpdateTrack(trackID int, title string, genre, coverImageURL *string) error {
	query := `
		UPDATE tracks 
		SET title = $1, genre = $2, cover_image_url = $3, updated_at = NOW()
		WHERE id = $4
	`
	result, err := r.Db.Exec(query, title, genre, coverImageURL, trackID)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// DeleteTrack deletes a track from the database
func (r *Repository) DeleteTrack(trackID int) error {
	query := `DELETE FROM tracks WHERE id = $1`
	result, err := r.Db.Exec(query, trackID)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// GetTrackOwner returns the artist_id (owner) of a track
func (r *Repository) GetTrackOwner(trackID int) (int, error) {
	var artistID int
	query := `SELECT artist_id FROM tracks WHERE id = $1`
	err := r.Db.QueryRow(query, trackID).Scan(&artistID)
	if err != nil {
		return 0, err
	}
	return artistID, nil
}

// LikeTrack adds a track to user's favorites
func (r *Repository) LikeTrack(userID, trackID int) error {
	query := `
		INSERT INTO likes (user_id, track_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, track_id) DO NOTHING
	`
	_, err := r.Db.Exec(query, userID, trackID)
	return err
}

// UnlikeTrack removes a track from user's favorites
func (r *Repository) UnlikeTrack(userID, trackID int) error {
	query := `DELETE FROM likes WHERE user_id = $1 AND track_id = $2`
	_, err := r.Db.Exec(query, userID, trackID)
	return err
}

// IsTrackLiked checks if a user has liked a track
func (r *Repository) IsTrackLiked(userID, trackID int) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND track_id = $2)`
	var liked bool
	err := r.Db.QueryRow(query, userID, trackID).Scan(&liked)
	return liked, err
}

// GetUserFavoriteTracks returns all favorite tracks for a user
func (r *Repository) GetUserFavoriteTracks(userID int, limit, offset int) ([]models.TrackWithArtist, error) {
	query := `
		SELECT t.id, t.title, t.artist_id, u.username, t.file_url, 
		       COALESCE(t.duration, 0), COALESCE(t.cover_image_url, ''),
		       COALESCE(t.genre, ''), COALESCE(t.lyrics, ''),
		       COALESCE(t.quality_bitrate, 0), COALESCE(t.status, 'published'),
		       t.created_at, t.updated_at,
		       true as is_favorited
		FROM likes l
		JOIN tracks t ON l.track_id = t.id
		JOIN users u ON t.artist_id = u.id
		WHERE l.user_id = $1
		ORDER BY l.created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.Db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		if err := rows.Scan(
			&track.ID, &track.Title, &track.ArtistID, &track.ArtistName,
			&track.FileURL, &track.Duration, &track.CoverImageURL,
			&track.Genre, &track.Lyrics, &track.QualityBitrate,
			&track.Status, &track.CreatedAt, &track.UpdatedAt,
			&track.IsFavorited,
		); err != nil {
			slog.Error("Failed to scan track", "error", err)
			continue
		}
		tracks = append(tracks, track)
	}

	return tracks, rows.Err()
}

// GetTracksByIDWithFavorites returns tracks with their favorite status for a user
func (r *Repository) GetTracksByIDWithFavorites(userID int, ids []int) ([]models.TrackWithArtist, error) {
	if len(ids) == 0 {
		return []models.TrackWithArtist{}, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids)+1)
	args[0] = userID
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+2)
		args[i+1] = id
	}

	query := fmt.Sprintf(`
		SELECT t.id, t.title, t.artist_id, u.username, t.file_url, 
		       COALESCE(t.duration, 0), COALESCE(t.cover_image_url, ''),
		       COALESCE(t.genre, ''), COALESCE(t.lyrics, ''),
		       COALESCE(t.quality_bitrate, 0), COALESCE(t.status, 'published'),
		       t.created_at, t.updated_at, COALESCE(EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND track_id = t.id), false)
		FROM tracks t
		JOIN users u ON t.artist_id = u.id
		WHERE t.id IN (%s)
	`, strings.Join(placeholders, ","))

	rows, err := r.Db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		if err := rows.Scan(
			&track.ID, &track.Title, &track.ArtistID, &track.ArtistName,
			&track.FileURL, &track.Duration, &track.CoverImageURL,
			&track.Genre, &track.Lyrics, &track.QualityBitrate,
			&track.Status, &track.CreatedAt, &track.UpdatedAt, &track.IsFavorited,
		); err != nil {
			slog.Error("Failed to scan track", "error", err)
			continue
		}
		tracks = append(tracks, track)
	}

	return tracks, rows.Err()
}

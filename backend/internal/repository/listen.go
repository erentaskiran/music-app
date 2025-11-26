package repository

import (
	"music-app/backend/internal/models"
)

// RecordListen records a new listen event for a track
func (r *Repository) RecordListen(trackID int, userID *int, device, ip string, listenDuration int) error {
	query := `
		INSERT INTO listens (track_id, user_id, device, ip, listen_duration, timestamp)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`
	_, err := r.Db.Exec(query, trackID, userID, device, ip, listenDuration)
	return err
}

// GetRecentlyPlayed retrieves recently played tracks for a user
// Returns distinct tracks ordered by most recent play time
func (r *Repository) GetRecentlyPlayed(userID int, limit int) ([]models.RecentlyPlayedTrack, error) {
	query := `
		SELECT DISTINCT ON (t.id) 
			t.id, t.title, t.artist_id, 
			COALESCE(u.username, 'Unknown Artist') as artist_name,
			t.file_url, 
			COALESCE(t.duration, 0), 
			COALESCE(t.cover_image_url, ''), 
			COALESCE(t.genre, ''), 
			COALESCE(t.status, 'published'),
			l.timestamp as played_at
		FROM listens l
		INNER JOIN tracks t ON l.track_id = t.id
		LEFT JOIN users u ON t.artist_id = u.id
		WHERE l.user_id = $1 AND t.status = 'published'
		ORDER BY t.id, l.timestamp DESC
	`

	// Wrap the query to order by played_at and limit
	wrappedQuery := `
		SELECT * FROM (` + query + `) AS recent
		ORDER BY played_at DESC
		LIMIT $2
	`

	rows, err := r.Db.Query(wrappedQuery, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.RecentlyPlayedTrack
	for rows.Next() {
		var track models.RecentlyPlayedTrack
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.ArtistName,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Status,
			&track.PlayedAt,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return tracks, nil
}

// GetRecentlyPlayedPublic retrieves recently played tracks without user authentication
// This can be used to show popular/recent tracks globally
func (r *Repository) GetRecentlyPlayedPublic(limit int) ([]models.RecentlyPlayedTrack, error) {
	query := `
		SELECT DISTINCT ON (t.id) 
			t.id, t.title, t.artist_id, 
			COALESCE(u.username, 'Unknown Artist') as artist_name,
			t.file_url, 
			COALESCE(t.duration, 0), 
			COALESCE(t.cover_image_url, ''), 
			COALESCE(t.genre, ''), 
			COALESCE(t.status, 'published'),
			l.timestamp as played_at
		FROM listens l
		INNER JOIN tracks t ON l.track_id = t.id
		LEFT JOIN users u ON t.artist_id = u.id
		WHERE t.status = 'published'
		ORDER BY t.id, l.timestamp DESC
	`

	wrappedQuery := `
		SELECT * FROM (` + query + `) AS recent
		ORDER BY played_at DESC
		LIMIT $1
	`

	rows, err := r.Db.Query(wrappedQuery, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.RecentlyPlayedTrack
	for rows.Next() {
		var track models.RecentlyPlayedTrack
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.ArtistName,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Status,
			&track.PlayedAt,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return tracks, nil
}

// ClearRecentlyPlayed clears listening history for a user
func (r *Repository) ClearRecentlyPlayed(userID int) error {
	query := `DELETE FROM listens WHERE user_id = $1`
	_, err := r.Db.Exec(query, userID)
	return err
}

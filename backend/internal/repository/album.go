package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"music-app/backend/internal/models"
)

func (r *Repository) CreateAlbum(album *models.Album, trackIDs []int) error {
	tx, err := r.Db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO albums (title, artist_id, cover_url, release_date)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	err = tx.QueryRow(
		query,
		album.Title,
		album.ArtistID,
		album.CoverURL,
		album.ReleaseDate,
	).Scan(&album.ID, &album.CreatedAt)

	if err != nil {
		return err
	}

	if len(trackIDs) > 0 {
		stmt, err := tx.Prepare("INSERT INTO album_tracks (album_id, track_id) VALUES ($1, $2)")
		if err != nil {
			return err
		}

		for _, trackID := range trackIDs {
			if _, err := stmt.Exec(album.ID, trackID); err != nil {
				stmt.Close()
				return err
			}
		}
		stmt.Close()
	}

	return tx.Commit()
}

func (r *Repository) GetAlbumByID(id int) (*models.AlbumWithTracks, error) {
	album := &models.AlbumWithTracks{}
	query := `
		SELECT a.id, a.title, a.artist_id, u.username, a.cover_url, a.release_date, a.created_at
		FROM albums a
		JOIN users u ON a.artist_id = u.id
		WHERE a.id = $1
	`

	err := r.Db.QueryRow(query, id).Scan(
		&album.ID,
		&album.Title,
		&album.ArtistID,
		&album.ArtistName,
		&album.CoverURL,
		&album.ReleaseDate,
		&album.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("album not found")
		}
		return nil, fmt.Errorf("failed to get album: %w", err)
	}

	// Get tracks
	tracksQuery := `
		SELECT t.id, t.title, t.artist_id, u.username, t.file_url, t.duration, 
		       t.cover_image_url, t.genre, t.lyrics, t.quality_bitrate, t.status, 
		       t.created_at, t.updated_at
		FROM tracks t
		INNER JOIN album_tracks at ON t.id = at.track_id
		LEFT JOIN users u ON t.artist_id = u.id
		WHERE at.album_id = $1
		ORDER BY at.id ASC
	`

	rows, err := r.Db.Query(tracksQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get album tracks: %w", err)
	}
	defer rows.Close()

	tracks := []models.TrackWithArtist{}
	for rows.Next() {
		var track models.TrackWithArtist
		if err := rows.Scan(
			&track.ID, &track.Title, &track.ArtistID, &track.ArtistName,
			&track.FileURL, &track.Duration, &track.CoverImageURL,
			&track.Genre, &track.Lyrics, &track.QualityBitrate,
			&track.Status, &track.CreatedAt, &track.UpdatedAt,
		); err != nil {
			slog.Error("Failed to scan track", "error", err)
			continue
		}
		tracks = append(tracks, track)
	}
	album.Tracks = tracks

	return album, nil
}

func (r *Repository) GetAlbumByIDWithFavorites(id int, userID int) (*models.AlbumWithTracks, error) {
	album := &models.AlbumWithTracks{}
	query := `
		SELECT a.id, a.title, a.artist_id, u.username, a.cover_url, a.release_date, a.created_at
		FROM albums a
		JOIN users u ON a.artist_id = u.id
		WHERE a.id = $1
	`

	err := r.Db.QueryRow(query, id).Scan(
		&album.ID,
		&album.Title,
		&album.ArtistID,
		&album.ArtistName,
		&album.CoverURL,
		&album.ReleaseDate,
		&album.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("album not found")
		}
		return nil, fmt.Errorf("failed to get album: %w", err)
	}

	// Get tracks with favorite status
	tracksQuery := `
		SELECT t.id, t.title, t.artist_id, u.username, t.file_url, t.duration, 
		       t.cover_image_url, t.genre, t.lyrics, t.quality_bitrate, t.status, 
		       t.created_at, t.updated_at,
		       CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_favorited
		FROM tracks t
		INNER JOIN album_tracks at ON t.id = at.track_id
		LEFT JOIN users u ON t.artist_id = u.id
		LEFT JOIN likes l ON t.id = l.track_id AND l.user_id = $2
		WHERE at.album_id = $1
		ORDER BY at.id ASC
	`

	rows, err := r.Db.Query(tracksQuery, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get album tracks: %w", err)
	}
	defer rows.Close()

	tracks := []models.TrackWithArtist{}
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
	album.Tracks = tracks

	return album, nil
}

func (r *Repository) GetAllAlbums() ([]models.AlbumWithTracks, error) {
	query := `
		SELECT a.id, a.title, a.artist_id, u.username, a.cover_url, a.release_date, a.created_at
		FROM albums a
		JOIN users u ON a.artist_id = u.id
		ORDER BY a.created_at DESC
	`

	rows, err := r.Db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get albums: %w", err)
	}
	defer rows.Close()

	albums := []models.AlbumWithTracks{}
	for rows.Next() {
		var album models.AlbumWithTracks
		if err := rows.Scan(
			&album.ID, &album.Title, &album.ArtistID, &album.ArtistName,
			&album.CoverURL, &album.ReleaseDate, &album.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan album: %w", err)
		}
		albums = append(albums, album)
	}

	return albums, nil
}

func (r *Repository) SearchAlbums(query string) ([]models.AlbumWithTracks, error) {
	sqlQuery := `
		SELECT a.id, a.title, a.artist_id, u.username, a.cover_url, a.release_date, a.created_at
		FROM albums a
		JOIN users u ON a.artist_id = u.id
		WHERE a.title ILIKE '%' || $1 || '%' OR u.username ILIKE '%' || $1 || '%'
		ORDER BY a.created_at DESC
	`

	rows, err := r.Db.Query(sqlQuery, query)
	if err != nil {
		return nil, fmt.Errorf("failed to search albums: %w", err)
	}
	defer rows.Close()

	albums := []models.AlbumWithTracks{}
	for rows.Next() {
		var album models.AlbumWithTracks
		if err := rows.Scan(
			&album.ID, &album.Title, &album.ArtistID, &album.ArtistName,
			&album.CoverURL, &album.ReleaseDate, &album.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan album: %w", err)
		}
		albums = append(albums, album)
	}

	return albums, nil
}

func (r *Repository) AddTrackToAlbum(albumID, trackID int) error {
	query := "INSERT INTO album_tracks (album_id, track_id) VALUES ($1, $2)"
	_, err := r.Db.Exec(query, albumID, trackID)
	return err
}

func (r *Repository) RemoveTrackFromAlbum(albumID, trackID int) error {
	query := "DELETE FROM album_tracks WHERE album_id = $1 AND track_id = $2"
	_, err := r.Db.Exec(query, albumID, trackID)
	return err
}

func (r *Repository) DeleteAlbum(id int) error {
	query := "DELETE FROM albums WHERE id = $1"
	result, err := r.Db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("album not found")
	}
	return nil
}

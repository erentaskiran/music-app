package repository

import (
	"database/sql"
	"music-app/backend/internal/models"
)

// GetArtistByID retrieves an artist by their user ID
func (r *Repository) GetArtistByID(artistID int) (*models.Artist, error) {
	query := `
		SELECT id, username, email, avatar_url, role, created_at
		FROM users
		WHERE id = $1
	`
	row := r.Db.QueryRow(query, artistID)

	var artist models.Artist
	err := row.Scan(&artist.ID, &artist.Username, &artist.Email, &artist.AvatarURL, &artist.Role, &artist.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &artist, nil
}

// GetArtistDetails retrieves detailed artist information including statistics
func (r *Repository) GetArtistDetails(artistID int) (*models.ArtistDetails, error) {
	query := `
		SELECT 
			u.id, 
			u.username, 
			u.email, 
			u.avatar_url, 
			u.role, 
			u.created_at,
			COALESCE(track_count.total, 0) as total_tracks,
			COALESCE(album_count.total, 0) as total_albums,
			COALESCE(listen_count.total, 0) as total_listens
		FROM users u
		LEFT JOIN (
			SELECT artist_id, COUNT(*) as total 
			FROM tracks 
			WHERE status = 'published'
			GROUP BY artist_id
		) track_count ON u.id = track_count.artist_id
		LEFT JOIN (
			SELECT artist_id, COUNT(*) as total 
			FROM albums 
			GROUP BY artist_id
		) album_count ON u.id = album_count.artist_id
		LEFT JOIN (
			SELECT t.artist_id, COUNT(*) as total 
			FROM listens l
			JOIN tracks t ON l.track_id = t.id
			GROUP BY t.artist_id
		) listen_count ON u.id = listen_count.artist_id
		WHERE u.id = $1
	`
	row := r.Db.QueryRow(query, artistID)

	var artist models.ArtistDetails
	err := row.Scan(
		&artist.ID,
		&artist.Username,
		&artist.Email,
		&artist.AvatarURL,
		&artist.Role,
		&artist.CreatedAt,
		&artist.TotalTracks,
		&artist.TotalAlbums,
		&artist.TotalListens,
	)
	if err != nil {
		return nil, err
	}

	return &artist, nil
}

// GetArtistTopTracks retrieves the top tracks for an artist based on listen count
func (r *Repository) GetArtistTopTracks(artistID int, limit int, userID *int) ([]models.TrackWithArtist, error) {
	query := `
		SELECT 
			t.id,
			t.title,
			t.artist_id,
			u.username as artist_name,
			t.file_url,
			t.duration,
			t.cover_image_url,
			t.genre,
			t.lyrics,
			t.quality_bitrate,
			t.status,
			t.created_at,
			t.updated_at,
			COALESCE(listen_counts.play_count, 0) as play_count,
			CASE 
				WHEN $3::int IS NOT NULL AND likes.user_id IS NOT NULL THEN true 
				ELSE false 
			END as is_favorited
		FROM tracks t
		JOIN users u ON t.artist_id = u.id
		LEFT JOIN (
			SELECT track_id, COUNT(*) as play_count
			FROM listens
			GROUP BY track_id
		) listen_counts ON t.id = listen_counts.track_id
		LEFT JOIN likes ON t.id = likes.track_id AND likes.user_id = $3
		WHERE t.artist_id = $1 AND t.status = 'published'
		ORDER BY play_count DESC, t.created_at DESC
		LIMIT $2
	`

	var rows *sql.Rows
	var err error

	if userID != nil {
		rows, err = r.Db.Query(query, artistID, limit, *userID)
	} else {
		rows, err = r.Db.Query(query, artistID, limit, nil)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tracks []models.TrackWithArtist
	for rows.Next() {
		var track models.TrackWithArtist
		var playCount int
		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&track.ArtistName,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&playCount,
			&track.IsFavorited,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}

	if tracks == nil {
		tracks = []models.TrackWithArtist{}
	}

	return tracks, nil
}

// GetArtistAlbums retrieves all albums for an artist
func (r *Repository) GetArtistAlbums(artistID int) ([]models.Album, error) {
	query := `
		SELECT id, title, artist_id, cover_url, release_date, created_at
		FROM albums
		WHERE artist_id = $1
		ORDER BY release_date DESC, created_at DESC
	`
	rows, err := r.Db.Query(query, artistID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var albums []models.Album
	for rows.Next() {
		var album models.Album
		err := rows.Scan(
			&album.ID,
			&album.Title,
			&album.ArtistID,
			&album.CoverURL,
			&album.ReleaseDate,
			&album.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		albums = append(albums, album)
	}

	if albums == nil {
		albums = []models.Album{}
	}

	return albums, nil
}

// GetArtistTracks retrieves all tracks for an artist
func (r *Repository) GetArtistTracks(artistID int, userID *int) ([]models.TrackWithArtist, error) {
	query := `
		SELECT 
			t.id,
			t.title,
			t.artist_id,
			u.username as artist_name,
			t.file_url,
			t.duration,
			t.cover_image_url,
			t.genre,
			t.lyrics,
			t.quality_bitrate,
			t.status,
			t.created_at,
			t.updated_at,
			CASE 
				WHEN $2::int IS NOT NULL AND likes.user_id IS NOT NULL THEN true 
				ELSE false 
			END as is_favorited
		FROM tracks t
		JOIN users u ON t.artist_id = u.id
		LEFT JOIN likes ON t.id = likes.track_id AND likes.user_id = $2
		WHERE t.artist_id = $1 AND t.status = 'published'
		ORDER BY t.created_at DESC
	`

	var rows *sql.Rows
	var err error

	if userID != nil {
		rows, err = r.Db.Query(query, artistID, *userID)
	} else {
		rows, err = r.Db.Query(query, artistID, nil)
	}

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
			&track.ArtistName,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&track.IsFavorited,
		)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}

	if tracks == nil {
		tracks = []models.TrackWithArtist{}
	}

	return tracks, nil
}

// SearchArtists searches for artists by username
func (r *Repository) SearchArtists(query string, limit int) ([]models.ArtistWithStats, error) {
	searchQuery := `
		SELECT 
			u.id,
			u.username,
			u.avatar_url,
			COALESCE(track_count.total, 0) as total_tracks,
			COALESCE(album_count.total, 0) as total_albums,
			COALESCE(listen_count.total, 0) as total_listens
		FROM users u
		LEFT JOIN (
			SELECT artist_id, COUNT(*) as total 
			FROM tracks 
			WHERE status = 'published'
			GROUP BY artist_id
		) track_count ON u.id = track_count.artist_id
		LEFT JOIN (
			SELECT artist_id, COUNT(*) as total 
			FROM albums 
			GROUP BY artist_id
		) album_count ON u.id = album_count.artist_id
		LEFT JOIN (
			SELECT t.artist_id, COUNT(*) as total 
			FROM listens l
			JOIN tracks t ON l.track_id = t.id
			GROUP BY t.artist_id
		) listen_count ON u.id = listen_count.artist_id
		WHERE LOWER(u.username) LIKE LOWER($1)
		AND (track_count.total > 0 OR album_count.total > 0)
		ORDER BY total_listens DESC, total_tracks DESC
		LIMIT $2
	`

	rows, err := r.Db.Query(searchQuery, "%"+query+"%", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artists []models.ArtistWithStats
	for rows.Next() {
		var artist models.ArtistWithStats
		err := rows.Scan(
			&artist.ID,
			&artist.Username,
			&artist.AvatarURL,
			&artist.TotalTracks,
			&artist.TotalAlbums,
			&artist.TotalListens,
		)
		if err != nil {
			return nil, err
		}
		artists = append(artists, artist)
	}

	if artists == nil {
		artists = []models.ArtistWithStats{}
	}

	return artists, nil
}

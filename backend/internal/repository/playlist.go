package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"music-app/backend/internal/models"
	"time"
)

type PlaylistRepository struct {
	db *sql.DB
}

func NewPlaylistRepository(db *sql.DB) *PlaylistRepository {
	return &PlaylistRepository{db: db}
}

// CreatePlaylist creates a new playlist
func (pr *PlaylistRepository) CreatePlaylist(playlist *models.Playlist) (*models.Playlist, error) {
	query := `
		INSERT INTO playlists (title, creator_id, privacy, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`

	privacy := "public"
	if playlist.Privacy != "" {
		privacy = playlist.Privacy
	}

	err := pr.db.QueryRow(
		query,
		playlist.Title,
		playlist.CreatorID,
		privacy,
		time.Now(),
	).Scan(&playlist.ID, &playlist.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create playlist: %w", err)
	}

	playlist.Privacy = privacy
	return playlist, nil
}

// GetPlaylistByID retrieves a playlist by ID with its tracks
func (pr *PlaylistRepository) GetPlaylistByID(id int) (*models.PlaylistWithTracks, error) {
	slog.Info("Getting playlist by ID", "playlistID", id)

	playlist := &models.Playlist{}
	query := `
		SELECT id, title, creator_id, cover_url, privacy, created_at
		FROM playlists
		WHERE id = $1
	`

	err := pr.db.QueryRow(query, id).Scan(
		&playlist.ID,
		&playlist.Title,
		&playlist.CreatorID,
		&playlist.CoverURL,
		&playlist.Privacy,
		&playlist.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			slog.Warn("Playlist not found", "playlistID", id)
			return nil, fmt.Errorf("playlist not found")
		}
		slog.Error("Failed to get playlist", "error", err, "playlistID", id)
		return nil, fmt.Errorf("failed to get playlist: %w", err)
	}

	slog.Info("Playlist found", "playlistID", id, "title", playlist.Title)

	// Get tracks in the playlist
	tracksQuery := `
		SELECT t.id, t.title, t.artist_id, u.username, t.file_url, t.duration, 
		       t.cover_image_url, t.genre, t.lyrics, t.quality_bitrate, t.status, 
		       t.created_at, t.updated_at
		FROM tracks t
		INNER JOIN playlist_tracks pt ON t.id = pt.track_id
		LEFT JOIN users u ON t.artist_id = u.id
		WHERE pt.playlist_id = $1
		ORDER BY pt.id DESC
	`

	rows, err := pr.db.Query(tracksQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get playlist tracks: %w", err)
	}
	defer rows.Close()

	tracks := []models.TrackWithArtist{}
	for rows.Next() {
		var track models.Track
		var artistName string

		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&artistName, // u.username from LEFT JOIN
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
			slog.Error("Failed to scan track", "error", err, "playlistID", id)
			return nil, fmt.Errorf("failed to scan track: %w", err)
		}

		trackWithArtist := models.TrackWithArtist{
			ID:             track.ID,
			Title:          track.Title,
			ArtistID:       track.ArtistID,
			ArtistName:     artistName,
			FileURL:        track.FileURL,
			Duration:       track.Duration,
			CoverImageURL:  track.CoverImageURL,
			Genre:          track.Genre,
			Lyrics:         track.Lyrics,
			QualityBitrate: track.QualityBitrate,
			Status:         track.Status,
			CreatedAt:      track.CreatedAt,
			UpdatedAt:      track.UpdatedAt,
		}

		tracks = append(tracks, trackWithArtist)
	}

	slog.Info("Tracks fetched for playlist", "playlistID", id, "trackCount", len(tracks))

	return &models.PlaylistWithTracks{
		ID:        playlist.ID,
		Title:     playlist.Title,
		CreatorID: playlist.CreatorID,
		CoverURL:  playlist.CoverURL,
		Privacy:   playlist.Privacy,
		CreatedAt: playlist.CreatedAt,
		Tracks:    tracks,
	}, nil
}

// GetPlaylistByIDWithFavorites retrieves a playlist by ID with its tracks and favorite status for a user
func (pr *PlaylistRepository) GetPlaylistByIDWithFavorites(id int, userID int) (*models.PlaylistWithTracks, error) {
	slog.Info("Getting playlist by ID with favorites", "playlistID", id, "userID", userID)

	playlist := &models.Playlist{}
	query := `
		SELECT id, title, creator_id, cover_url, privacy, created_at
		FROM playlists
		WHERE id = $1
	`

	err := pr.db.QueryRow(query, id).Scan(
		&playlist.ID,
		&playlist.Title,
		&playlist.CreatorID,
		&playlist.CoverURL,
		&playlist.Privacy,
		&playlist.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			slog.Warn("Playlist not found", "playlistID", id)
			return nil, fmt.Errorf("playlist not found")
		}
		slog.Error("Failed to get playlist", "error", err, "playlistID", id)
		return nil, fmt.Errorf("failed to get playlist: %w", err)
	}

	slog.Info("Playlist found", "playlistID", id, "title", playlist.Title)

	// Get tracks in the playlist with favorite status
	tracksQuery := `
		SELECT t.id, t.title, t.artist_id, u.username, t.file_url, t.duration, 
		       t.cover_image_url, t.genre, t.lyrics, t.quality_bitrate, t.status, 
		       t.created_at, t.updated_at,
		       CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_favorited
		FROM tracks t
		INNER JOIN playlist_tracks pt ON t.id = pt.track_id
		LEFT JOIN users u ON t.artist_id = u.id
		LEFT JOIN likes l ON t.id = l.track_id AND l.user_id = $2
		WHERE pt.playlist_id = $1
		ORDER BY pt.id DESC
	`

	rows, err := pr.db.Query(tracksQuery, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get playlist tracks: %w", err)
	}
	defer rows.Close()

	tracks := []models.TrackWithArtist{}
	for rows.Next() {
		var track models.Track
		var artistName string
		var isFavorited bool

		err := rows.Scan(
			&track.ID,
			&track.Title,
			&track.ArtistID,
			&artistName,
			&track.FileURL,
			&track.Duration,
			&track.CoverImageURL,
			&track.Genre,
			&track.Lyrics,
			&track.QualityBitrate,
			&track.Status,
			&track.CreatedAt,
			&track.UpdatedAt,
			&isFavorited,
		)
		if err != nil {
			slog.Error("Failed to scan track", "error", err, "playlistID", id)
			return nil, fmt.Errorf("failed to scan track: %w", err)
		}

		trackWithArtist := models.TrackWithArtist{
			ID:             track.ID,
			Title:          track.Title,
			ArtistID:       track.ArtistID,
			ArtistName:     artistName,
			FileURL:        track.FileURL,
			Duration:       track.Duration,
			CoverImageURL:  track.CoverImageURL,
			Genre:          track.Genre,
			Lyrics:         track.Lyrics,
			QualityBitrate: track.QualityBitrate,
			Status:         track.Status,
			CreatedAt:      track.CreatedAt,
			UpdatedAt:      track.UpdatedAt,
			IsFavorited:    isFavorited,
		}

		tracks = append(tracks, trackWithArtist)
	}

	slog.Info("Tracks fetched for playlist", "playlistID", id, "trackCount", len(tracks))

	return &models.PlaylistWithTracks{
		ID:        playlist.ID,
		Title:     playlist.Title,
		CreatorID: playlist.CreatorID,
		CoverURL:  playlist.CoverURL,
		Privacy:   playlist.Privacy,
		CreatedAt: playlist.CreatedAt,
		Tracks:    tracks,
	}, nil
}

// GetUserPlaylists retrieves all playlists for a user
func (pr *PlaylistRepository) GetUserPlaylists(userID int) ([]models.Playlist, error) {
	query := `
		SELECT id, title, creator_id, cover_url, privacy, created_at
		FROM playlists
		WHERE creator_id = $1
		ORDER BY created_at DESC
	`

	rows, err := pr.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user playlists: %w", err)
	}
	defer rows.Close()

	playlists := []models.Playlist{}
	for rows.Next() {
		var p models.Playlist
		err := rows.Scan(&p.ID, &p.Title, &p.CreatorID, &p.CoverURL, &p.Privacy, &p.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan playlist: %w", err)
		}
		playlists = append(playlists, p)
	}

	return playlists, nil
}

// UpdatePlaylist updates a playlist
func (pr *PlaylistRepository) UpdatePlaylist(id int, creatorID int, update *models.UpdatePlaylistRequest) (*models.Playlist, error) {
	// Check if playlist belongs to the user
	var actualCreatorID int
	err := pr.db.QueryRow("SELECT creator_id FROM playlists WHERE id = $1", id).Scan(&actualCreatorID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("playlist not found")
		}
		return nil, err
	}

	if actualCreatorID != creatorID {
		return nil, fmt.Errorf("you don't have permission to update this playlist")
	}

	query := `
		UPDATE playlists
		SET title = COALESCE($1, title),
		    privacy = COALESCE($2, privacy)
		WHERE id = $3
		RETURNING id, title, creator_id, cover_url, privacy, created_at
	`

	playlist := &models.Playlist{}
	err = pr.db.QueryRow(query, update.Title, update.Privacy, id).Scan(
		&playlist.ID,
		&playlist.Title,
		&playlist.CreatorID,
		&playlist.CoverURL,
		&playlist.Privacy,
		&playlist.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update playlist: %w", err)
	}

	return playlist, nil
}

// UpdatePlaylistCover updates a playlist's cover image URL
func (pr *PlaylistRepository) UpdatePlaylistCover(id int, creatorID int, coverURL string) (*models.Playlist, error) {
	// Check if playlist belongs to the user
	var actualCreatorID int
	err := pr.db.QueryRow("SELECT creator_id FROM playlists WHERE id = $1", id).Scan(&actualCreatorID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("playlist not found")
		}
		return nil, err
	}

	if actualCreatorID != creatorID {
		return nil, fmt.Errorf("you don't have permission to update this playlist")
	}

	query := `
		UPDATE playlists
		SET cover_url = $1
		WHERE id = $2
		RETURNING id, title, creator_id, cover_url, privacy, created_at
	`

	playlist := &models.Playlist{}
	err = pr.db.QueryRow(query, coverURL, id).Scan(
		&playlist.ID,
		&playlist.Title,
		&playlist.CreatorID,
		&playlist.CoverURL,
		&playlist.Privacy,
		&playlist.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update playlist cover: %w", err)
	}

	return playlist, nil
}

// DeletePlaylist deletes a playlist and its tracks
func (pr *PlaylistRepository) DeletePlaylist(id int, creatorID int) error {
	// Check if playlist belongs to the user
	var actualCreatorID int
	err := pr.db.QueryRow("SELECT creator_id FROM playlists WHERE id = $1", id).Scan(&actualCreatorID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("playlist not found")
		}
		return err
	}

	if actualCreatorID != creatorID {
		return fmt.Errorf("you don't have permission to delete this playlist")
	}

	// Delete playlist tracks first (due to foreign key)
	_, err = pr.db.Exec("DELETE FROM playlist_tracks WHERE playlist_id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete playlist tracks: %w", err)
	}

	// Delete playlist
	_, err = pr.db.Exec("DELETE FROM playlists WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete playlist: %w", err)
	}

	return nil
}

// AddTrackToPlaylist adds a track to a playlist
func (pr *PlaylistRepository) AddTrackToPlaylist(playlistID int, trackID int, creatorID int) error {
	// Check if playlist belongs to the user
	var actualCreatorID int
	err := pr.db.QueryRow("SELECT creator_id FROM playlists WHERE id = $1", playlistID).Scan(&actualCreatorID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("playlist not found")
		}
		return err
	}

	if actualCreatorID != creatorID {
		return fmt.Errorf("you don't have permission to modify this playlist")
	}

	// Check if track exists
	var trackExists bool
	err = pr.db.QueryRow("SELECT EXISTS(SELECT 1 FROM tracks WHERE id = $1)", trackID).Scan(&trackExists)
	if err != nil || !trackExists {
		return fmt.Errorf("track not found")
	}

	// Check if track is already in playlist
	var alreadyExists bool
	err = pr.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2)",
		playlistID, trackID,
	).Scan(&alreadyExists)
	if err != nil {
		return err
	}

	if alreadyExists {
		return fmt.Errorf("track already in playlist")
	}

	// Add track to playlist
	_, err = pr.db.Exec(
		"INSERT INTO playlist_tracks (playlist_id, track_id) VALUES ($1, $2)",
		playlistID, trackID,
	)
	if err != nil {
		return fmt.Errorf("failed to add track to playlist: %w", err)
	}

	return nil
}

// RemoveTrackFromPlaylist removes a track from a playlist
func (pr *PlaylistRepository) RemoveTrackFromPlaylist(playlistID int, trackID int, creatorID int) error {
	// Check if playlist belongs to the user
	var actualCreatorID int
	err := pr.db.QueryRow("SELECT creator_id FROM playlists WHERE id = $1", playlistID).Scan(&actualCreatorID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("playlist not found")
		}
		return err
	}

	if actualCreatorID != creatorID {
		return fmt.Errorf("you don't have permission to modify this playlist")
	}

	result, err := pr.db.Exec(
		"DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2",
		playlistID, trackID,
	)
	if err != nil {
		return fmt.Errorf("failed to remove track from playlist: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("track not found in playlist")
	}

	return nil
}

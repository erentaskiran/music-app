package api

import (
	"fmt"
	"log/slog"
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

// CreateAlbumHandler godoc
// @Summary Create a new album
// @Description Creates a new album with cover art.
// @Tags Protected
// @Accept multipart/form-data
// @Produce json
// @Security ApiKeyAuth
// @Param cover_image formData file false "Cover Image (Max 10MB)"
// @Param title formData string true "Album Title"
// @Param artist_name formData string true "Artist Name"
// @Param release_year formData int false "Release Year"
// @Success 201 {object} models.Album
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/albums [post]
func (r *Router) CreateAlbumHandler(w http.ResponseWriter, req *http.Request) {
	// Parse multipart form with size limit
	if err := req.ParseMultipartForm(MaxUploadSize); err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "failed to parse form", http.StatusBadRequest)
		return
	}

	// Get fields
	title := req.FormValue("title")
	artistName := req.FormValue("artist_name")
	releaseYear := req.FormValue("release_year")

	if title == "" || artistName == "" {
		utils.JSONError(w, api_errors.ErrBadRequest, "title and artist_name are required", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)

	// Resolve Artist ID
	artist, err := repo.GetUserByUsername(artistName)
	if err != nil {
		utils.JSONError(w, api_errors.ErrNotFound, "artist not found", http.StatusNotFound)
		return
	}

	// Handle Cover Image Upload
	var coverURL *string
	file, header, err := req.FormFile("cover_image")
	if err == nil {
		defer file.Close()

		// Validate content type
		contentType := header.Header.Get("Content-Type")
		// Basic image validation could be added here

		// Sanitize filename
		sanitizedFilename := sanitizeFilename(header.Filename)

		// Upload to MinIO
		url, err := r.Storage.UploadFile(req.Context(), file, header.Size, contentType, "albums/"+sanitizedFilename)
		if err != nil {
			slog.Error("Failed to upload album cover",
				"error", err,
				"user_id", artist.ID,
				"filename", sanitizedFilename)
			utils.JSONError(w, api_errors.ErrInternalServer, "failed to upload cover image", http.StatusInternalServerError)
			return
		}
		coverURL = &url
	}

	// Parse Release Year (Date)
	var releaseDate *time.Time
	if releaseYear != "" {
		year, err := strconv.Atoi(releaseYear)
		if err == nil {
			date := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
			releaseDate = &date
		}
	}

	album := &models.Album{
		Title:       title,
		ArtistID:    artist.ID,
		CoverURL:    coverURL,
		ReleaseDate: releaseDate,
	}

	// Parse track IDs
	var trackIDs []int
	trackIDsStr := req.FormValue("track_ids")
	if trackIDsStr != "" {
		// Assuming comma separated values
		ids := strings.Split(trackIDsStr, ",")
		for _, id := range ids {
			if tid, err := strconv.Atoi(strings.TrimSpace(id)); err == nil {
				trackIDs = append(trackIDs, tid)
			}
		}
	}

	if err := repo.CreateAlbum(album, trackIDs); err != nil {
		slog.Error("Failed to create album", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, fmt.Sprintf("failed to create album: %v", err), http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, album, http.StatusCreated)
}

// GetAlbumHandler godoc
// @Summary Get album by ID
// @Description Retrieves an album by ID with its tracks
// @Tags Albums
// @Produce json
// @Param id path int true "Album ID"
// @Success 200 {object} models.AlbumWithTracks
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/albums/{id} [get]
func (r *Router) GetAlbumHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid album ID", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)

	// Get user ID from context if authenticated
	userID, isAuthenticated := middleware.GetUserID(req.Context())

	var album interface{}
	if isAuthenticated {
		// Get album with favorite status for authenticated users
		album, err = repo.GetAlbumByIDWithFavorites(id, userID)
	} else {
		// Get album without favorite status for unauthenticated users
		album, err = repo.GetAlbumByID(id)
	}

	if err != nil {
		if err.Error() == "album not found" {
			utils.JSONError(w, api_errors.ErrNotFound, "album not found", http.StatusNotFound)
			return
		}
		slog.Error("Failed to get album", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get album", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, album, http.StatusOK)
}

// GetAlbumsHandler godoc
// @Summary Get all albums
// @Description Retrieves all albums
// @Tags Albums
// @Produce json
// @Success 200 {array} models.AlbumWithTracks
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/albums [get]
func (r *Router) GetAlbumsHandler(w http.ResponseWriter, req *http.Request) {
	repo := repository.NewRepository(r.Db)
	albums, err := repo.GetAllAlbums()
	if err != nil {
		slog.Error("Failed to get albums", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get albums", http.StatusInternalServerError)
		return
	}

	if albums == nil {
		albums = []models.AlbumWithTracks{}
	}

	utils.JSONSuccess(w, albums, http.StatusOK)
}

// AddTrackToAlbumHandler godoc
// @Summary Add track to album
// @Description Adds a track to an album
// @Tags Albums
// @Accept json
// @Produce json
// @Param id path int true "Album ID"
// @Param track_id body int true "Track ID"
// @Success 200 {string} string "OK"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/albums/{id}/tracks [post]
func (r *Router) AddTrackToAlbumHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	albumID, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid album ID", http.StatusBadRequest)
		return
	}

	var body struct {
		TrackID int `json:"track_id"`
	}
	if err := utils.DecodeJSONBody(w, req, &body); err != nil {
		return
	}

	repo := repository.NewRepository(r.Db)
	if err := repo.AddTrackToAlbum(albumID, body.TrackID); err != nil {
		slog.Error("Failed to add track to album", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to add track to album", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, "OK", http.StatusOK)
}

// RemoveTrackFromAlbumHandler godoc
// @Summary Remove track from album
// @Description Removes a track from an album
// @Tags Albums
// @Param id path int true "Album ID"
// @Param trackId path int true "Track ID"
// @Success 200 {string} string "OK"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/albums/{id}/tracks/{trackId} [delete]
func (r *Router) RemoveTrackFromAlbumHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	albumID, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid album ID", http.StatusBadRequest)
		return
	}

	trackID, err := strconv.Atoi(vars["trackId"])
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid track ID", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)
	if err := repo.RemoveTrackFromAlbum(albumID, trackID); err != nil {
		slog.Error("Failed to remove track from album", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to remove track from album", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, "OK", http.StatusOK)
}

// SearchAlbumsHandler godoc
// @Summary Search albums
// @Description Search for albums by title or artist
// @Tags Albums
// @Produce json
// @Param q query string true "Search query"
// @Success 200 {array} models.AlbumWithTracks
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/search/albums [get]
func (r *Router) SearchAlbumsHandler(w http.ResponseWriter, req *http.Request) {
	query := req.URL.Query().Get("q")
	if query == "" {
		utils.JSONError(w, api_errors.ErrBadRequest, "search query is required", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)
	albums, err := repo.SearchAlbums(query)
	if err != nil {
		slog.Error("Failed to search albums", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to search albums", http.StatusInternalServerError)
		return
	}

	if albums == nil {
		albums = []models.AlbumWithTracks{}
	}

	utils.JSONSuccess(w, albums, http.StatusOK)
}

// DeleteAlbumHandler godoc
// @Summary Delete an album
// @Description Deletes an album by ID
// @Tags Protected
// @Param id path int true "Album ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/albums/{id} [delete]
func (r *Router) DeleteAlbumHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid album id", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)
	if err := repo.DeleteAlbum(id); err != nil {
		if err.Error() == "album not found" {
			utils.JSONError(w, api_errors.ErrNotFound, "album not found", http.StatusNotFound)
			return
		}
		slog.Error("Failed to delete album", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to delete album", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, map[string]string{"message": "album deleted successfully"}, http.StatusOK)
}

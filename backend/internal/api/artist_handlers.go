package api

import (
	"database/sql"
	"encoding/json"
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/repository"
	"music-app/backend/pkg/api_errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GetArtistHandler godoc
// @Summary Get artist details
// @Description Retrieves detailed information about a specific artist including statistics
// @Tags artists
// @Accept json
// @Produce json
// @Param id path int true "Artist ID"
// @Success 200 {object} models.ArtistDetails
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/artists/{id} [get]
func (r *Router) GetArtistHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	artistIDStr := vars["id"]

	artistID, err := strconv.Atoi(artistIDStr)
	if err != nil {
		http.Error(w, api_errors.InvalidArtistID, http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)
	artist, err := repo.GetArtistDetails(artistID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, api_errors.ArtistNotFound, http.StatusNotFound)
			return
		}
		http.Error(w, api_errors.InternalServerError, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(artist)
}

// GetArtistTopTracksHandler godoc
// @Summary Get artist's top tracks
// @Description Retrieves the most popular tracks for a specific artist based on listen count
// @Tags artists
// @Accept json
// @Produce json
// @Param id path int true "Artist ID"
// @Param limit query int false "Maximum number of tracks to return (default: 10)"
// @Success 200 {array} models.TrackWithArtist
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/artists/{id}/top-tracks [get]
func (r *Router) GetArtistTopTracksHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	artistIDStr := vars["id"]

	artistID, err := strconv.Atoi(artistIDStr)
	if err != nil {
		http.Error(w, api_errors.InvalidArtistID, http.StatusBadRequest)
		return
	}

	// Get limit from query params, default to 10
	limit := 10
	if limitStr := req.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get user ID from context if authenticated
	var userID *int
	if id, ok := middleware.GetUserID(req.Context()); ok {
		userID = &id
	}

	repo := repository.NewRepository(r.Db)
	tracks, err := repo.GetArtistTopTracks(artistID, limit, userID)
	if err != nil {
		http.Error(w, api_errors.InternalServerError, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracks)
}

// GetArtistAlbumsHandler godoc
// @Summary Get artist's albums
// @Description Retrieves all albums for a specific artist
// @Tags artists
// @Accept json
// @Produce json
// @Param id path int true "Artist ID"
// @Success 200 {array} models.Album
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/artists/{id}/albums [get]
func (r *Router) GetArtistAlbumsHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	artistIDStr := vars["id"]

	artistID, err := strconv.Atoi(artistIDStr)
	if err != nil {
		http.Error(w, api_errors.InvalidArtistID, http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)
	albums, err := repo.GetArtistAlbums(artistID)
	if err != nil {
		http.Error(w, api_errors.InternalServerError, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(albums)
}

// GetArtistTracksHandler godoc
// @Summary Get artist's all tracks
// @Description Retrieves all tracks for a specific artist
// @Tags artists
// @Accept json
// @Produce json
// @Param id path int true "Artist ID"
// @Success 200 {array} models.TrackWithArtist
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/artists/{id}/tracks [get]
func (r *Router) GetArtistTracksHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	artistIDStr := vars["id"]

	artistID, err := strconv.Atoi(artistIDStr)
	if err != nil {
		http.Error(w, api_errors.InvalidArtistID, http.StatusBadRequest)
		return
	}

	// Get user ID from context if authenticated
	var userID *int
	if id, ok := middleware.GetUserID(req.Context()); ok {
		userID = &id
	}

	repo := repository.NewRepository(r.Db)
	tracks, err := repo.GetArtistTracks(artistID, userID)
	if err != nil {
		http.Error(w, api_errors.InternalServerError, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracks)
}

// SearchArtistsHandler godoc
// @Summary Search for artists
// @Description Search for artists by username
// @Tags artists
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Maximum number of results (default: 20)"
// @Success 200 {array} models.ArtistWithStats
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/search/artists [get]
func (r *Router) SearchArtistsHandler(w http.ResponseWriter, req *http.Request) {
	query := req.URL.Query().Get("q")
	if query == "" {
		http.Error(w, api_errors.MissingSearchQuery, http.StatusBadRequest)
		return
	}

	// Get limit from query params, default to 20
	limit := 20
	if limitStr := req.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	repo := repository.NewRepository(r.Db)
	artists, err := repo.SearchArtists(query, limit)
	if err != nil {
		http.Error(w, api_errors.InternalServerError, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(artists)
}

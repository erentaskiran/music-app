package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// Helper to extract userID with proper error handling
func getUserID(w http.ResponseWriter, req *http.Request) (int, bool) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok || userID == 0 {
		utils.JSONError(w, "UNAUTHORIZED", "Unauthorized", http.StatusUnauthorized)
		return 0, false
	}
	return userID, true
}

// CreatePlaylistHandler godoc
// @Summary Create Playlist
// @Description Create a new playlist for the authenticated user
// @Tags Playlists
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param playlist body models.CreatePlaylistRequest true "Playlist details"
// @Success 201 {object} models.PlaylistResponse
// @Failure 400 {object} api_errors.ErrorResponse
// @Failure 401 {object} api_errors.ErrorResponse
// @Router /api/playlists [post]
func (r *Router) CreatePlaylistHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok || userID == 0 {
		utils.JSONError(w, "UNAUTHORIZED", "Unauthorized", http.StatusUnauthorized)
		return
	}

	var request models.CreatePlaylistRequest
	if err := json.NewDecoder(req.Body).Decode(&request); err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid request body", http.StatusBadRequest)
		return
	}

	if request.Title == "" {
		utils.JSONError(w, "INVALID_REQUEST", "Title is required", http.StatusBadRequest)
		return
	}

	playlistRepo := repository.NewPlaylistRepository(r.Db)
	playlist := &models.Playlist{
		Title:     request.Title,
		CreatorID: userID,
		Privacy:   request.Privacy,
	}

	created, err := playlistRepo.CreatePlaylist(playlist)
	if err != nil {
		slog.Error("Failed to create playlist", "error", err)
		utils.JSONError(w, "INTERNAL_ERROR", "Failed to create playlist", http.StatusInternalServerError)
		return
	}

	response := models.PlaylistResponse{
		ID:        created.ID,
		Title:     created.Title,
		CreatorID: created.CreatorID,
		CoverURL:  created.CoverURL,
		Privacy:   created.Privacy,
		CreatedAt: created.CreatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetPlaylistHandler godoc
// @Summary Get Playlist
// @Description Get a playlist with all its tracks
// @Tags Playlists
// @Accept  json
// @Produce  json
// @Param id path int true "Playlist ID"
// @Success 200 {object} models.PlaylistWithTracks
// @Failure 404 {object} utils.ErrorResponse
// @Router /api/playlists/{id} [get]
func (r *Router) GetPlaylistHandler(w http.ResponseWriter, req *http.Request) {
	fmt.Println("=== GetPlaylistHandler START ===")

	vars := mux.Vars(req)
	fmt.Printf("mux.Vars result: %v\n", vars)

	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		fmt.Printf("PARSE ERROR: %v, vars=%v\n", err, vars)
		slog.Error("Failed to parse ID", "error", err, "vars", vars)
		utils.JSONError(w, "INVALID_REQUEST", "Invalid playlist ID", http.StatusBadRequest)
		return
	}

	slog.Info("Getting playlist", "playlistID", id)

	playlistRepo := repository.NewPlaylistRepository(r.Db)
	
	// Get user ID from context if authenticated
	userID, isAuthenticated := middleware.GetUserID(req.Context())
	
	var playlist *models.PlaylistWithTracks
	if isAuthenticated {
		// Get playlist with favorite status for authenticated users
		playlist, err = playlistRepo.GetPlaylistByIDWithFavorites(id, userID)
	} else {
		// Get playlist without favorite status for unauthenticated users
		playlist, err = playlistRepo.GetPlaylistByID(id)
	}
	
	if err != nil {
		slog.Error("Failed to get playlist", "error", err, "playlistID", id)
		utils.JSONError(w, "NOT_FOUND", "Playlist not found", http.StatusNotFound)
		return
	}

	slog.Info("Playlist retrieved successfully", "playlistID", id)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(playlist)
}

// GetUserPlaylistsHandler godoc
// @Summary Get User Playlists
// @Description Get all playlists for the authenticated user
// @Tags Playlists
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Success 200 {array} models.PlaylistResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/playlists [get]
func (r *Router) GetUserPlaylistsHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := getUserID(w, req)
	if !ok {
		return
	}

	playlistRepo := repository.NewPlaylistRepository(r.Db)
	playlists, err := playlistRepo.GetUserPlaylists(userID)
	if err != nil {
		slog.Error("Failed to get user playlists", "error", err)
		utils.JSONError(w, "INTERNAL_ERROR", "Failed to get playlists", http.StatusInternalServerError)
		return
	}

	if playlists == nil {
		playlists = []models.Playlist{}
	}

	response := make([]models.PlaylistResponse, len(playlists))
	for i, p := range playlists {
		response[i] = models.PlaylistResponse{
			ID:        p.ID,
			Title:     p.Title,
			CreatorID: p.CreatorID,
			CoverURL:  p.CoverURL,
			Privacy:   p.Privacy,
			CreatedAt: p.CreatedAt,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// UpdatePlaylistHandler godoc
// @Summary Update Playlist
// @Description Update a playlist (only for the creator)
// @Tags Playlists
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param id path int true "Playlist ID"
// @Param playlist body models.UpdatePlaylistRequest true "Updated playlist details"
// @Success 200 {object} models.PlaylistResponse
// @Failure 400 {object} api_errors.ErrorResponse
// @Failure 401 {object} api_errors.ErrorResponse
// @Failure 403 {object} api_errors.ErrorResponse
// @Failure 404 {object} api_errors.ErrorResponse
// @Router /api/playlists/{id} [put]
func (r *Router) UpdatePlaylistHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := getUserID(w, req)
	if !ok {
		return
	}

	vars := mux.Vars(req)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid playlist ID", http.StatusBadRequest)
		return
	}

	var request models.UpdatePlaylistRequest
	if err := json.NewDecoder(req.Body).Decode(&request); err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid request body", http.StatusBadRequest)
		return
	}

	playlistRepo := repository.NewPlaylistRepository(r.Db)
	updated, err := playlistRepo.UpdatePlaylist(id, userID, &request)
	if err != nil {
		if err.Error() == "playlist not found" {
			utils.JSONError(w, "NOT_FOUND", "Playlist not found", http.StatusNotFound)
		} else if err.Error() == "you don't have permission to update this playlist" {
			utils.JSONError(w, "FORBIDDEN", "You don't have permission to update this playlist", http.StatusForbidden)
		} else {
			slog.Error("Failed to update playlist", "error", err)
			utils.JSONError(w, "INTERNAL_ERROR", "Failed to update playlist", http.StatusInternalServerError)
		}
		return
	}

	response := models.PlaylistResponse{
		ID:        updated.ID,
		Title:     updated.Title,
		CreatorID: updated.CreatorID,
		CoverURL:  updated.CoverURL,
		Privacy:   updated.Privacy,
		CreatedAt: updated.CreatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// DeletePlaylistHandler godoc
// @Summary Delete Playlist
// @Description Delete a playlist (only for the creator)
// @Tags Playlists
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param id path int true "Playlist ID"
// @Success 204
// @Failure 401 {object} api_errors.ErrorResponse
// @Failure 403 {object} api_errors.ErrorResponse
// @Failure 404 {object} api_errors.ErrorResponse
// @Router /api/playlists/{id} [delete]
func (r *Router) DeletePlaylistHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := getUserID(w, req)
	if !ok {
		return
	}

	vars := mux.Vars(req)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid playlist ID", http.StatusBadRequest)
		return
	}

	playlistRepo := repository.NewPlaylistRepository(r.Db)
	err = playlistRepo.DeletePlaylist(id, userID)
	if err != nil {
		if err.Error() == "playlist not found" {
			utils.JSONError(w, "NOT_FOUND", "Playlist not found", http.StatusNotFound)
		} else if err.Error() == "you don't have permission to delete this playlist" {
			utils.JSONError(w, "FORBIDDEN", "You don't have permission to delete this playlist", http.StatusForbidden)
		} else {
			slog.Error("Failed to delete playlist", "error", err)
			utils.JSONError(w, "INTERNAL_ERROR", "Failed to delete playlist", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddTrackToPlaylistHandler godoc
// @Summary Add Track to Playlist
// @Description Add a track to a playlist
// @Tags Playlists
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param id path int true "Playlist ID"
// @Param track body models.AddTrackToPlaylistRequest true "Track ID"
// @Success 201
// @Failure 400 {object} api_errors.ErrorResponse
// @Failure 401 {object} api_errors.ErrorResponse
// @Failure 403 {object} api_errors.ErrorResponse
// @Failure 404 {object} api_errors.ErrorResponse
// @Router /api/playlists/{id}/tracks [post]
func (r *Router) AddTrackToPlaylistHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := getUserID(w, req)
	if !ok {
		return
	}

	vars := mux.Vars(req)
	playlistID, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid playlist ID", http.StatusBadRequest)
		return
	}

	var request models.AddTrackToPlaylistRequest
	if err := json.NewDecoder(req.Body).Decode(&request); err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid request body", http.StatusBadRequest)
		return
	}

	slog.Info("Adding track to playlist", "playlistID", playlistID, "trackID", request.TrackID, "userID", userID)

	playlistRepo := repository.NewPlaylistRepository(r.Db)
	err = playlistRepo.AddTrackToPlaylist(playlistID, request.TrackID, userID)
	if err != nil {
		slog.Error("Failed to add track to playlist", "error", err, "playlistID", playlistID, "trackID", request.TrackID)
		if err.Error() == "playlist not found" || err.Error() == "track not found" {
			utils.JSONError(w, "NOT_FOUND", err.Error(), http.StatusNotFound)
		} else if err.Error() == "you don't have permission to modify this playlist" {
			utils.JSONError(w, "FORBIDDEN", err.Error(), http.StatusForbidden)
		} else if err.Error() == "track already in playlist" {
			utils.JSONError(w, "CONFLICT", err.Error(), http.StatusBadRequest)
		} else {
			slog.Error("Failed to add track to playlist", "error", err)
			utils.JSONError(w, "INTERNAL_ERROR", "Failed to add track to playlist", http.StatusInternalServerError)
		}
		return
	}

	slog.Info("Track added to playlist successfully", "playlistID", playlistID, "trackID", request.TrackID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Track added to playlist",
	})
}

// RemoveTrackFromPlaylistHandler godoc
// @Summary Remove Track from Playlist
// @Description Remove a track from a playlist
// @Tags Playlists
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param id path int true "Playlist ID"
// @Param trackId path int true "Track ID"
// @Success 204
// @Failure 401 {object} api_errors.ErrorResponse
// @Failure 403 {object} api_errors.ErrorResponse
// @Failure 404 {object} api_errors.ErrorResponse
// @Router /api/playlists/{id}/tracks/{trackId} [delete]
func (r *Router) RemoveTrackFromPlaylistHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := getUserID(w, req)
	if !ok {
		return
	}

	vars := mux.Vars(req)
	playlistID, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid playlist ID", http.StatusBadRequest)
		return
	}

	trackID, err := strconv.Atoi(vars["trackId"])
	if err != nil {
		utils.JSONError(w, "INVALID_REQUEST", "Invalid track ID", http.StatusBadRequest)
		return
	}

	playlistRepo := repository.NewPlaylistRepository(r.Db)
	err = playlistRepo.RemoveTrackFromPlaylist(playlistID, trackID, userID)
	if err != nil {
		if err.Error() == "playlist not found" || err.Error() == "track not found in playlist" {
			utils.JSONError(w, "NOT_FOUND", err.Error(), http.StatusNotFound)
		} else if err.Error() == "you don't have permission to modify this playlist" {
			utils.JSONError(w, "FORBIDDEN", err.Error(), http.StatusForbidden)
		} else {
			slog.Error("Failed to remove track from playlist", "error", err)
			utils.JSONError(w, "INTERNAL_ERROR", "Failed to remove track from playlist", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNoContent)
}

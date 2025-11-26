package api

import (
	"encoding/json"
	"fmt"
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"net"
	"net/http"
	"strconv"
)

// GetRecentlyPlayedHandler godoc
// @Summary Get Recently Played Tracks
// @Description Retrieves the user's recently played tracks
// @Tags History
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param limit query int false "Number of tracks to return (default 20, max 50)"
// @Success 200 {array} models.RecentlyPlayedTrack
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/history/recently-played [get]
func (r *Router) GetRecentlyPlayedHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse limit parameter
	limit := 20
	if l := req.URL.Query().Get("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
			if limit > 50 {
				limit = 50
			}
		}
	}

	repo := repository.NewRepository(r.Db)
	tracks, err := repo.GetRecentlyPlayed(userID, limit)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get recently played tracks", http.StatusInternalServerError)
		return
	}

	// Return empty array if no tracks
	if tracks == nil {
		tracks = []models.RecentlyPlayedTrack{}
	}

	utils.JSONSuccess(w, tracks, http.StatusOK)
}

// RecordListenHandler godoc
// @Summary Record a Track Listen
// @Description Records that the user has listened to a track
// @Tags History
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param body body models.RecordListenRequest true "Listen details"
// @Success 200 {object} map[string]string
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/history/listen [post]
func (r *Router) RecordListenHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "unauthorized", http.StatusUnauthorized)
		return
	}

	var listenReq models.RecordListenRequest
	if err := json.NewDecoder(req.Body).Decode(&listenReq); err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid request body", http.StatusBadRequest)
		return
	}

	if listenReq.TrackID <= 0 {
		utils.JSONError(w, api_errors.ErrBadRequest, "track_id is required", http.StatusBadRequest)
		return
	}

	// Verify track exists
	repo := repository.NewRepository(r.Db)
	track, err := repo.GetTrackByID(listenReq.TrackID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to verify track", http.StatusInternalServerError)
		return
	}
	if track == nil {
		utils.JSONError(w, api_errors.ErrNotFound, "track not found", http.StatusNotFound)
		return
	}

	// Get client IP
	ip := req.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = req.Header.Get("X-Real-IP")
	}
	if ip == "" {
		ip = req.RemoteAddr
	}

	// Strip port from IP address if present (INET type doesn't accept port)
	if host, _, err := net.SplitHostPort(ip); err == nil {
		ip = host
	}

	// Record the listen
	err = repo.RecordListen(listenReq.TrackID, &userID, listenReq.Device, ip, listenReq.ListenDuration)
	if err != nil {
		// Log the actual error for debugging
		fmt.Printf("RecordListen error: %v, IP: %s, TrackID: %d, UserID: %d\n", err, ip, listenReq.TrackID, userID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to record listen", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, map[string]string{"message": "listen recorded"}, http.StatusOK)
}

// ClearHistoryHandler godoc
// @Summary Clear Listening History
// @Description Clears all listening history for the authenticated user
// @Tags History
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/history/clear [delete]
func (r *Router) ClearHistoryHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "unauthorized", http.StatusUnauthorized)
		return
	}

	repo := repository.NewRepository(r.Db)
	err := repo.ClearRecentlyPlayed(userID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to clear history", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, map[string]string{"message": "history cleared"}, http.StatusOK)
}

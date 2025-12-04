package api

import (
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/minio/minio-go/v7"
)

// CreateTrackHandler godoc
// @Summary Create a new track
// @Description Creates a new track by uploading a file and saving details. Maximum file size: 10MB.
// @Tags Protected
// @Accept multipart/form-data
// @Produce json
// @Security ApiKeyAuth
// @Param file formData file true "Track file (MP3, WAV, FLAC - Max 10MB)"
// @Param title formData string true "Track Title"
// @Param duration formData int false "Duration in seconds"
// @Param cover_image_url formData string false "Cover Image URL"
// @Param genre formData string false "Genre"
// @Success 201 {object} models.Track
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/tracks [post]
func (r *Router) CreateTrackHandler(w http.ResponseWriter, req *http.Request) {
	// Parse multipart form with size limit
	if err := req.ParseMultipartForm(MaxUploadSize); err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "failed to parse form", http.StatusBadRequest)
		return
	}

	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "no user in context", http.StatusUnauthorized)
		return
	}

	// Get file
	file, header, err := req.FormFile("file")
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate content type
	contentType := header.Header.Get("Content-Type")
	isValid := false
	for _, vt := range ValidAudioTypes {
		if contentType == vt {
			isValid = true
			break
		}
	}
	if !isValid {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid file type, only audio files are allowed", http.StatusBadRequest)
		return
	}

	// Sanitize filename to prevent path traversal
	sanitizedFilename := sanitizeFilename(header.Filename)

	// Upload to MinIO
	fileURL, err := r.Storage.UploadFile(req.Context(), file, header.Size, header.Header.Get("Content-Type"), sanitizedFilename)
	if err != nil {
		slog.Error("Failed to upload file to MinIO",
			"error", err,
			"user_id", userID,
			"filename", sanitizedFilename,
			"size", header.Size,
			"content_type", contentType)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to upload file", http.StatusInternalServerError)
		return
	}

	// Get other fields
	title := req.FormValue("title")
	if title == "" {
		utils.JSONError(w, api_errors.ErrBadRequest, "title is required", http.StatusBadRequest)
		return
	}

	// Parse optional fields
	duration := 0
	if d := req.FormValue("duration"); d != "" {
		if parsedDuration, err := strconv.Atoi(d); err == nil {
			duration = parsedDuration
		}
	}

	// Helper to convert empty string to nil pointer
	stringPtr := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}

	track := &models.Track{
		Title:         title,
		ArtistID:      userID,
		FileURL:       fileURL,
		Duration:      duration,
		CoverImageURL: stringPtr(req.FormValue("cover_image_url")),
		Genre:         stringPtr(req.FormValue("genre")),
	}

	repo := repository.NewRepository(r.Db)
	if err := repo.CreateTrack(track); err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to create track", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, track, http.StatusCreated)
}

// sanitizeFilename removes path separators and problematic characters from filenames
func sanitizeFilename(filename string) string {
	// Get just the base filename, removing any directory paths
	filename = filepath.Base(filename)
	// Replace path separators with underscores as extra safety
	filename = strings.ReplaceAll(filename, "/", "_")
	filename = strings.ReplaceAll(filename, "\\", "_")
	return filename
}

// StreamTrackHandler godoc
// @Summary Stream a track
// @Description Streams an audio track by ID. Supports HTTP Range requests for seeking.
// @Tags Tracks
// @Produce audio/mpeg
// @Produce audio/wav
// @Produce audio/flac
// @Param id path int true "Track ID"
// @Success 200 {file} binary "Audio stream"
// @Success 206 {file} binary "Partial audio stream (range request)"
// @Failure 400 {object} utils.ErrorResponse "Invalid track ID"
// @Failure 404 {object} utils.ErrorResponse "Track not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /api/tracks/{id}/stream [get]
func (r *Router) StreamTrackHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	trackIDStr := vars["id"]

	trackID, err := strconv.Atoi(trackIDStr)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid track ID", http.StatusBadRequest)
		return
	}

	// Get track from database
	repo := repository.NewRepository(r.Db)
	track, err := repo.GetTrackByID(trackID)
	if err != nil {
		slog.Error("Failed to get track", "error", err, "track_id", trackID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get track", http.StatusInternalServerError)
		return
	}
	if track == nil {
		utils.JSONError(w, api_errors.ErrNotFound, "track not found", http.StatusNotFound)
		return
	}

	// Extract object name from file URL
	objectName := r.Storage.ExtractObjectName(track.FileURL)
	if objectName == "" {
		slog.Error("Failed to extract object name from URL", "file_url", track.FileURL)
		utils.JSONError(w, api_errors.ErrInternalServer, "invalid file URL", http.StatusInternalServerError)
		return
	}

	// Get object info for content length and type
	objInfo, err := r.Storage.GetObjectInfo(req.Context(), objectName)
	if err != nil {
		slog.Error("Failed to get object info", "error", err, "object_name", objectName)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get file info", http.StatusInternalServerError)
		return
	}

	fileSize := objInfo.Size
	contentType := objInfo.ContentType
	if contentType == "" {
		contentType = "audio/mpeg" // Default to MP3
	}

	// Handle Range header for seeking support
	rangeHeader := req.Header.Get("Range")
	var start, end int64 = 0, fileSize - 1

	opts := minio.GetObjectOptions{}

	if rangeHeader != "" {
		// Parse Range header (e.g., "bytes=0-1023")
		if strings.HasPrefix(rangeHeader, "bytes=") {
			rangeSpec := strings.TrimPrefix(rangeHeader, "bytes=")
			parts := strings.Split(rangeSpec, "-")
			if len(parts) == 2 {
				if parts[0] != "" {
					start, _ = strconv.ParseInt(parts[0], 10, 64)
				}
				if parts[1] != "" {
					end, _ = strconv.ParseInt(parts[1], 10, 64)
				} else {
					end = fileSize - 1
				}
			}
		}

		// Validate range
		if start > end || start >= fileSize {
			w.Header().Set("Content-Range", fmt.Sprintf("bytes */%d", fileSize))
			w.WriteHeader(http.StatusRequestedRangeNotSatisfiable)
			return
		}

		if end >= fileSize {
			end = fileSize - 1
		}

		// Set range for MinIO request
		opts.SetRange(start, end)
	}

	// Get object from MinIO
	obj, err := r.Storage.GetObject(req.Context(), objectName, opts)
	if err != nil {
		slog.Error("Failed to get object from storage", "error", err, "object_name", objectName)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to stream file", http.StatusInternalServerError)
		return
	}
	defer obj.Close()

	// Set response headers
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", track.Title))

	if rangeHeader != "" {
		// Partial content response
		contentLength := end - start + 1
		w.Header().Set("Content-Length", strconv.FormatInt(contentLength, 10))
		w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
		w.WriteHeader(http.StatusPartialContent)
	} else {
		// Full content response
		w.Header().Set("Content-Length", strconv.FormatInt(fileSize, 10))
		w.WriteHeader(http.StatusOK)
	}

	// Stream the content
	if _, err := io.Copy(w, obj); err != nil {
		slog.Error("Failed to stream file content", "error", err, "track_id", trackID)
		// Can't send error response here as headers are already sent
		return
	}
}

// GetTracksHandler godoc
// @Summary Get all tracks
// @Description Retrieves a list of all published tracks with artist information
// @Tags Tracks
// @Produce json
// @Param limit query int false "Number of tracks to return (default 50)"
// @Param offset query int false "Offset for pagination (default 0)"
// @Success 200 {array} models.TrackWithArtist
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/tracks [get]
func (r *Router) GetTracksHandler(w http.ResponseWriter, req *http.Request) {
	// Parse query parameters
	limit := 50
	offset := 0

	if l := req.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	if o := req.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	repo := repository.NewRepository(r.Db)
	tracks, err := repo.GetAllTracks(limit, offset)
	if err != nil {
		slog.Error("Failed to get tracks", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get tracks", http.StatusInternalServerError)
		return
	}

	// Return empty array instead of null if no tracks
	if tracks == nil {
		tracks = []models.TrackWithArtist{}
	}

	utils.JSONSuccess(w, tracks, http.StatusOK)
}

// SearchHandler godoc
// @Summary Search tracks
// @Description Search for tracks by title, artist, or genre
// @Tags Tracks
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Number of tracks to return (default 50)"
// @Param offset query int false "Offset for pagination (default 0)"
// @Success 200 {array} models.TrackWithArtist
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/search [get]
func (r *Router) SearchHandler(w http.ResponseWriter, req *http.Request) {
	query := req.URL.Query().Get("q")
	if query == "" {
		utils.JSONError(w, api_errors.ErrBadRequest, "search query is required", http.StatusBadRequest)
		return
	}

	limit := 50
	offset := 0

	if l := req.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	if o := req.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	repo := repository.NewRepository(r.Db)
	tracks, err := repo.SearchTracks(query, limit, offset)
	if err != nil {
		slog.Error("Failed to search tracks", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to search tracks", http.StatusInternalServerError)
		return
	}

	if tracks == nil {
		tracks = []models.TrackWithArtist{}
	}

	utils.JSONSuccess(w, tracks, http.StatusOK)
}

// GetMyTracksHandler godoc
// @Summary Get current user's uploaded tracks
// @Description Retrieves all tracks uploaded by the currently authenticated user
// @Tags Protected
// @Produce json
// @Security ApiKeyAuth
// @Param limit query int false "Number of tracks to return (default 50)"
// @Param offset query int false "Offset for pagination (default 0)"
// @Success 200 {array} models.TrackWithArtist
// @Failure 401 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/my-tracks [get]
func (r *Router) GetMyTracksHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "no user in context", http.StatusUnauthorized)
		return
	}

	// Parse query parameters
	limit := 50
	offset := 0

	if l := req.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	if o := req.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	repo := repository.NewRepository(r.Db)
	tracks, err := repo.GetTracksByArtistID(userID, limit, offset)
	if err != nil {
		slog.Error("Failed to get user tracks", "error", err, "user_id", userID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get tracks", http.StatusInternalServerError)
		return
	}

	// Return empty array instead of null if no tracks
	if tracks == nil {
		tracks = []models.TrackWithArtist{}
	}

	utils.JSONSuccess(w, tracks, http.StatusOK)
}

// DeleteTrackHandler godoc
// @Summary Delete a track
// @Description Deletes a track owned by the current user. Also removes the file from storage.
// @Tags Protected
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "Track ID"
// @Success 204 "Track deleted successfully"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/my-tracks/{id} [delete]
func (r *Router) DeleteTrackHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "no user in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(req)
	trackIDStr := vars["id"]
	trackID, err := strconv.Atoi(trackIDStr)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid track ID", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)

	// Verify ownership
	ownerID, err := repo.GetTrackOwner(trackID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSONError(w, api_errors.ErrNotFound, "track not found", http.StatusNotFound)
			return
		}
		slog.Error("Failed to get track owner", "error", err, "track_id", trackID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to verify ownership", http.StatusInternalServerError)
		return
	}

	if ownerID != userID {
		utils.JSONError(w, api_errors.ErrForbidden, "you don't have permission to delete this track", http.StatusForbidden)
		return
	}

	// Get track info to delete file from storage
	track, err := repo.GetTrackByID(trackID)
	if err != nil {
		slog.Error("Failed to get track", "error", err, "track_id", trackID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get track info", http.StatusInternalServerError)
		return
	}

	// Delete from database first
	if err := repo.DeleteTrack(trackID); err != nil {
		slog.Error("Failed to delete track from database", "error", err, "track_id", trackID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to delete track", http.StatusInternalServerError)
		return
	}

	// Delete file from storage (best effort - don't fail if this fails)
	if track != nil && track.FileURL != "" {
		objectName := r.Storage.ExtractObjectName(track.FileURL)
		if objectName != "" {
			if err := r.Storage.DeleteFile(req.Context(), objectName); err != nil {
				slog.Warn("Failed to delete file from storage", "error", err, "object_name", objectName)
			}
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

// UpdateTrackHandler godoc
// @Summary Update a track's details
// @Description Updates the title, genre, or cover image URL of a track owned by the current user
// @Tags Protected
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "Track ID"
// @Param body body object true "Track update data" example({"title": "New Title", "genre": "Rock", "cover_image_url": "https://example.com/cover.jpg"})
// @Success 200 {object} models.Track
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/my-tracks/{id} [put]
func (r *Router) UpdateTrackHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "no user in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(req)
	trackIDStr := vars["id"]
	trackID, err := strconv.Atoi(trackIDStr)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid track ID", http.StatusBadRequest)
		return
	}

	// Parse request body
	var updateData struct {
		Title         string  `json:"title"`
		Genre         *string `json:"genre"`
		CoverImageURL *string `json:"cover_image_url"`
	}

	if err := utils.DecodeJSONBody(w, req, &updateData); err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid request body", http.StatusBadRequest)
		return
	}

	if updateData.Title == "" {
		utils.JSONError(w, api_errors.ErrBadRequest, "title is required", http.StatusBadRequest)
		return
	}

	if len(updateData.Title) > 200 {
		utils.JSONError(w, api_errors.ErrBadRequest, "title must be 200 characters or less", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(r.Db)

	// Verify ownership
	ownerID, err := repo.GetTrackOwner(trackID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSONError(w, api_errors.ErrNotFound, "track not found", http.StatusNotFound)
			return
		}
		slog.Error("Failed to get track owner", "error", err, "track_id", trackID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to verify ownership", http.StatusInternalServerError)
		return
	}

	if ownerID != userID {
		utils.JSONError(w, api_errors.ErrForbidden, "you don't have permission to update this track", http.StatusForbidden)
		return
	}

	// Update track
	if err := repo.UpdateTrack(trackID, updateData.Title, updateData.Genre, updateData.CoverImageURL); err != nil {
		slog.Error("Failed to update track", "error", err, "track_id", trackID)
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to update track", http.StatusInternalServerError)
		return
	}

	// Get updated track
	track, err := repo.GetTrackByID(trackID)
	if err != nil {
		slog.Error("Failed to get updated track", "error", err, "track_id", trackID)
		utils.JSONError(w, api_errors.ErrInternalServer, "track updated but failed to retrieve", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, track, http.StatusOK)
}

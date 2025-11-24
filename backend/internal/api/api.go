package api

import (
	"database/sql"
	"fmt"
	"music-app/backend/internal/api/auth"
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"music-app/backend/pkg/config"
	"music-app/backend/pkg/storage"
	"net/http"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
)

type Router struct {
	Db         *sql.DB
	JWTManager *utils.JWTManager
	Config     *config.Config
	Storage    *storage.MinioClient
}

func NewRouter(db *sql.DB, jwtManager *utils.JWTManager, cfg *config.Config, storage *storage.MinioClient) *Router {
	return &Router{
		Db:         db,
		JWTManager: jwtManager,
		Config:     cfg,
		Storage:    storage,
	}
}

func (r *Router) NewRouter() *mux.Router {
	router := mux.NewRouter()
	h := auth.NewAuthHandler(r.Db, r.JWTManager)
	authMiddleware := middleware.NewAuthMiddleware(r.JWTManager)

	// CORS middleware
	router.Use(middleware.CORS)

	// Swagger
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	// Public routes
	router.HandleFunc("/api/health", r.HealthCheckHandler).Methods(http.MethodGet)
	router.HandleFunc("/api/register", h.RegisterHandler).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/login", h.LoginHandler).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/refresh", h.RefreshHandler).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/logout", h.LogoutHandler).Methods(http.MethodPost, http.MethodOptions)

	// Protected routes
	protected := router.PathPrefix("/api").Subrouter()
	protected.HandleFunc("/me", r.MeHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/tracks/upload", r.CreateTrackHandler).Methods(http.MethodPost, http.MethodOptions)
	protected.Use(authMiddleware.Authenticated)

	return router
}

// HealthCheckHandler godoc
// @Summary Health Check
// @Description Checks if the server is running
// @Tags Public
// @Success 200 {string} string "OK"
// @Router /api/health [get]
func (r *Router) HealthCheckHandler(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// MeHandler godoc
// @Summary Get Current User
// @Description Retrieves the profile of the currently authenticated user
// @Tags Protected
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Success 200 {object} models.UserProfileResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /api/me [get]
func (r *Router) MeHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "no user in context", http.StatusUnauthorized)
		return
	}
	repo := repository.NewRepository(r.Db)
	u, err := repo.GetUserByID(userID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrUserNotFound, "user not found", http.StatusNotFound)
		return
	}
	utils.JSONSuccess(w, models.UserProfileResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		Role:      u.Role,
		AvatarURL: u.AvatarURL,
	}, http.StatusOK)
}

// CreateTrackHandler godoc
// @Summary Create a new track
// @Description Creates a new track by uploading a file and saving details
// @Tags Protected
// @Accept multipart/form-data
// @Produce json
// @Security ApiKeyAuth
// @Param file formData file true "Track file (MP3)"
// @Param title formData string true "Track Title"
// @Param duration formData int false "Duration in seconds"
// @Param cover_image_url formData string false "Cover Image URL"
// @Param genre formData string false "Genre"
// @Success 201 {object} models.Track
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/tracks [post]
func (r *Router) CreateTrackHandler(w http.ResponseWriter, req *http.Request) {
	// Parse multipart form (10MB limit)
	if err := req.ParseMultipartForm(10 << 20); err != nil {
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
	validTypes := []string{"audio/mpeg", "audio/mp3", "audio/wav", "audio/flac"}
	isValid := false
	for _, vt := range validTypes {
		if contentType == vt {
			isValid = true
			break
		}
	}
	if !isValid {
		utils.JSONError(w, api_errors.ErrBadRequest, "invalid file type, only audio files are allowed", http.StatusBadRequest)
		return
	}

	// Upload to MinIO
	fileURL, err := r.Storage.UploadFile(req.Context(), file, header.Size, header.Header.Get("Content-Type"), header.Filename)
	if err != nil {
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
		fmt.Sscanf(d, "%d", &duration)
	}

	track := &models.Track{
		Title:         title,
		ArtistID:      userID,
		FileURL:       fileURL,
		Duration:      duration,
		CoverImageURL: req.FormValue("cover_image_url"),
		Genre:         req.FormValue("genre"),
	}

	repo := repository.NewRepository(r.Db)
	if err := repo.CreateTrack(track); err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to create track", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, track, http.StatusCreated)
}

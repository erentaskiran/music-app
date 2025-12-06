package api

import (
	"database/sql"
	"music-app/backend/internal/api/auth"
	"music-app/backend/internal/middleware"
	"music-app/backend/pkg/config"
	"music-app/backend/pkg/storage"
	"net/http"

	"music-app/backend/internal/utils"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
)

var (
	ValidAudioTypes = []string{"audio/mpeg", "audio/mp3", "audio/wav", "audio/flac"}
	// MaxUploadSize defines the maximum file size for uploads (10MB)
	MaxUploadSize int64 = 10 << 20
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
	authMiddleware := middleware.NewAuthMiddleware(r.JWTManager, r.Db)

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
	router.HandleFunc("/api/tracks", r.GetTracksHandler).Methods(http.MethodGet, http.MethodOptions)
	router.HandleFunc("/api/search", r.SearchHandler).Methods(http.MethodGet, http.MethodOptions)
	router.HandleFunc("/api/search/albums", r.SearchAlbumsHandler).Methods(http.MethodGet, http.MethodOptions)
	router.HandleFunc("/api/search/users", r.SearchUsersHandler).Methods(http.MethodGet, http.MethodOptions)
	router.HandleFunc("/api/albums", r.GetAlbumsHandler).Methods(http.MethodGet, http.MethodOptions)
	router.HandleFunc("/api/albums/{id}", r.GetAlbumHandler).Methods(http.MethodGet, http.MethodOptions)
	router.HandleFunc("/api/tracks/{id}/stream", r.StreamTrackHandler).Methods(http.MethodGet, http.MethodOptions)

	// Protected routes (authenticated users)
	protected := router.PathPrefix("/api").Subrouter()
	protected.HandleFunc("/me", r.MeHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/users", r.GetUsersHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/profile", h.GetProfileHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/profile", h.UpdateProfileHandler).Methods(http.MethodPut, http.MethodOptions)
	protected.HandleFunc("/profile/password", h.ChangePasswordHandler).Methods(http.MethodPut, http.MethodOptions)
	protected.HandleFunc("/history/recently-played", r.GetRecentlyPlayedHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/history/listen", r.RecordListenHandler).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/history/clear", r.ClearHistoryHandler).Methods(http.MethodDelete, http.MethodOptions)
	protected.HandleFunc("/favorites", r.GetFavoritesHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/tracks/{id}/like", r.LikeTrackHandler).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/tracks/{id}/unlike", r.UnlikeTrackHandler).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/my-tracks", r.GetMyTracksHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/my-tracks/{id}", r.UpdateTrackHandler).Methods(http.MethodPut, http.MethodOptions)
	protected.HandleFunc("/my-tracks/{id}", r.DeleteTrackHandler).Methods(http.MethodDelete, http.MethodOptions)
	// Playlist routes - GENERIC ROUTES FIRST (without {id})
	protected.HandleFunc("/playlists", r.CreatePlaylistHandler).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/playlists", r.GetUserPlaylistsHandler).Methods(http.MethodGet, http.MethodOptions)
	// SPECIFIC ROUTES AFTER GENERIC ONES
	protected.HandleFunc("/playlists/{id}", r.GetPlaylistHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/playlists/{id}", r.UpdatePlaylistHandler).Methods(http.MethodPut, http.MethodOptions)
	protected.HandleFunc("/playlists/{id}", r.DeletePlaylistHandler).Methods(http.MethodDelete, http.MethodOptions)
	protected.HandleFunc("/playlists/{id}/tracks", r.AddTrackToPlaylistHandler).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/playlists/{id}/tracks/{trackId}", r.RemoveTrackFromPlaylistHandler).Methods(http.MethodDelete, http.MethodOptions)
	protected.Use(authMiddleware.Authenticated)

	// Admin routes (requires admin role - verified via database query)
	admin := router.PathPrefix("/api").Subrouter()
	admin.HandleFunc("/tracks/upload", r.CreateTrackHandler).Methods(http.MethodPost, http.MethodOptions)
	admin.HandleFunc("/albums", r.CreateAlbumHandler).Methods(http.MethodPost, http.MethodOptions)
	admin.HandleFunc("/albums/{id}", r.DeleteAlbumHandler).Methods(http.MethodDelete, http.MethodOptions)
	admin.HandleFunc("/albums/{id}/tracks", r.AddTrackToAlbumHandler).Methods(http.MethodPost, http.MethodOptions)
	admin.HandleFunc("/albums/{id}/tracks/{trackId}", r.RemoveTrackFromAlbumHandler).Methods(http.MethodDelete, http.MethodOptions)
	admin.Use(authMiddleware.Authenticated)
	admin.Use(authMiddleware.RequireAdmin)

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

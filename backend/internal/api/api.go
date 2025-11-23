package api

import (
	"database/sql"
	"music-app/backend/internal/api/auth"
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"music-app/backend/pkg/config"
	"net/http"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
)

type Router struct {
	Db         *sql.DB
	JWTManager *utils.JWTManager
	Config     *config.Config
}

func NewRouter(db *sql.DB, jwtManager *utils.JWTManager, cfg *config.Config) *Router {
	return &Router{
		Db:         db,
		JWTManager: jwtManager,
		Config:     cfg,
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

package api

import (
	"database/sql"
	"encoding/json"
	"music-app/backend/internal/api/auth"
	"music-app/backend/internal/api/middleware"
	"music-app/backend/internal/repository"
	"net/http"

	"github.com/gorilla/mux"
)

type Router struct {
	Db *sql.DB
}

func NewRouter(db *sql.DB) *Router {
	return &Router{
		Db: db,
	}
}

func (r *Router) NewRouter() *mux.Router {
	router := mux.NewRouter()
	h := auth.NewAuthHandler(r.Db)

	// CORS middleware
	router.Use(middleware.CORS)

	// Public routes
	router.HandleFunc("/api/health", r.HealthCheckHandler).Methods(http.MethodGet)
	router.HandleFunc("/api/register", h.RegisterHandler).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/login", h.LoginHandler).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/refresh", h.RefreshHandler).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/logout", h.LogoutHandler).Methods(http.MethodPost, http.MethodOptions)

	// Protected routes
	protected := router.PathPrefix("/api").Subrouter()
	protected.HandleFunc("/me", r.MeHandler).Methods(http.MethodGet, http.MethodOptions)
	protected.Use(middleware.Authenticated)

	return router
}

func (r *Router) HealthCheckHandler(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func (r *Router) MeHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		http.Error(w, "no user in context", http.StatusUnauthorized)
		return
	}
	repo := repository.NewRepository(r.Db)
	u, err := repo.GetUserByID(userID)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"user_id": u.UserID,
		"name":    u.Name,
		"mail":    u.Mail,
	})
}

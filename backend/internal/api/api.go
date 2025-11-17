package api

import (
	"database/sql"
	"music-app/backend/internal/api/auth"
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
	router.HandleFunc("/api/health", r.HealthCheckHandler).Methods(http.MethodGet)
	router.HandleFunc("/api/register", h.RegisterHandler).Methods(http.MethodPost)
	router.HandleFunc("/api/login", h.LoginHandler).Methods(http.MethodPost)

	return router
}

func (r *Router) HealthCheckHandler(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

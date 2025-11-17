package auth

import (
	"database/sql"
	"encoding/json"
	"music-app/backend/internal/models"
	repository "music-app/backend/internal/repository"
	utils "music-app/backend/internal/utils"
	"net/http"
)

type AuthHandler struct {
	Db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{
		Db: db,
	}
}

func (h *AuthHandler) LoginHandler(w http.ResponseWriter, req *http.Request) {
	var loginReq models.LoginRequest
	err := json.NewDecoder(req.Body).Decode(&loginReq)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(h.Db)
	user, err := repo.CheckLogin(loginReq.Mail, loginReq.Password)
	if err != nil || user == nil {
		http.Error(w, "Invalid email or password"+err.Error(), http.StatusUnauthorized)
		return
	}

	tokenString, err := utils.CreateToken(user.UserID)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

func (h *AuthHandler) RegisterHandler(w http.ResponseWriter, req *http.Request) {
	var user models.RegisterRequest
	err := json.NewDecoder(req.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if user.Mail == "" && user.Password == "" && user.Name == "" {
		http.Error(w, "Missing fields", http.StatusBadRequest)
	}

	user.Password = utils.HashPassword(user.Password)

	repo := repository.NewRepository(h.Db)
	err = repo.CreateUser(&user)
	if err != nil {
		http.Error(w, "Error creating user"+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

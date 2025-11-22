package auth

import (
	"database/sql"
	"encoding/json"
	"music-app/backend/internal/models"
	repository "music-app/backend/internal/repository"
	utils "music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"net/http"
)

type AuthHandler struct {
	Db *sql.DB
	JWTManager *utils.JWTManager
}

func NewAuthHandler(db *sql.DB, jwtManager *utils.JWTManager) *AuthHandler {
	return &AuthHandler{
		Db: db,
		JWTManager: jwtManager,
	}
}

func (h *AuthHandler) LoginHandler(w http.ResponseWriter, req *http.Request) {
	var loginReq models.LoginRequest
	err := json.NewDecoder(req.Body).Decode(&loginReq)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "Invalid request payload", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(h.Db)
	user, err := repo.CheckLogin(loginReq.Mail, loginReq.Password)
	if err != nil || user == nil {
		utils.JSONError(w, api_errors.ErrInvalidCredentials, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	accessToken, err := h.JWTManager.CreateAccessToken(user.UserID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating access token", http.StatusInternalServerError)
		return
	}

	refreshToken, err := h.JWTManager.CreateRefreshToken(user.UserID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) RegisterHandler(w http.ResponseWriter, req *http.Request) {
	var user models.RegisterRequest
	err := json.NewDecoder(req.Body).Decode(&user)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if user.Mail == "" || user.Password == "" || user.Name == "" {
		utils.JSONError(w, api_errors.ErrMissingFields, "Missing fields", http.StatusBadRequest)
		return
	}

	user.Password = utils.HashPassword(user.Password)

	repo := repository.NewRepository(h.Db)
	err = repo.CreateUser(&user)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error creating user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) RefreshHandler(w http.ResponseWriter, req *http.Request) {
	var refreshReq struct {
		RefreshToken string `json:"refresh_token"`
	}
	err := json.NewDecoder(req.Body).Decode(&refreshReq)
	if err != nil {
		utils.JSONError(w, api_errors.ErrBadRequest, "Invalid request payload", http.StatusBadRequest)
		return
	}

	userID, err := h.JWTManager.ParseRefreshToken(refreshReq.RefreshToken)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInvalidToken, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	newAccessToken, err := h.JWTManager.CreateAccessToken(userID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating access token", http.StatusInternalServerError)
		return
	}

	newRefreshToken, err := h.JWTManager.CreateRefreshToken(userID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"access_token":  newAccessToken,
		"refresh_token": newRefreshToken,
	})
}

func (h *AuthHandler) LogoutHandler(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

package auth

import (
	"database/sql"
	"log/slog"
	"music-app/backend/internal/models"
	repository "music-app/backend/internal/repository"
	utils "music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"net/http"
	"strings"
)

type AuthHandler struct {
	Db         *sql.DB
	JWTManager *utils.JWTManager
}

func NewAuthHandler(db *sql.DB, jwtManager *utils.JWTManager) *AuthHandler {
	return &AuthHandler{
		Db:         db,
		JWTManager: jwtManager,
	}
}

// LoginHandler godoc
// @Summary User Login
// @Description Authenticates a user and returns access and refresh tokens
// @Tags Auth
// @Accept  json
// @Produce  json
// @Param   loginReq body models.LoginRequest true "Login Credentials"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/login [post]
func (h *AuthHandler) LoginHandler(w http.ResponseWriter, req *http.Request) {
	var loginReq models.LoginRequest
	if utils.DecodeJSONBody(w, req, &loginReq) != nil {
		return
	}

	repo := repository.NewRepository(h.Db)
	user, err := repo.CheckLogin(loginReq.Email, loginReq.Password)
	if err != nil || user == nil {
		utils.JSONError(w, api_errors.ErrInvalidCredentials, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	accessToken, err := h.JWTManager.CreateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating access token", http.StatusInternalServerError)
		return
	}

	refreshToken, err := h.JWTManager.CreateRefreshToken(user.ID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, http.StatusOK)
}

// RegisterHandler godoc
// @Summary Register User
// @Description Registers a new user. Set role to "admin" for admin registration.
// @Tags Auth
// @Accept  json
// @Produce  json
// @Param   registerReq body models.RegisterRequest true "User Registration"
// @Success 201 {object} models.RegisterRequest
// @Failure 400 {object} utils.ErrorResponse "Missing required fields"
// @Failure 409 {object} utils.ErrorResponse "Email or username already exists"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /api/register [post]
func (h *AuthHandler) RegisterHandler(w http.ResponseWriter, req *http.Request) {
	var user models.RegisterRequest
	if utils.DecodeJSONBody(w, req, &user) != nil {
		return
	}

	if user.Email == "" || user.Password == "" || user.Username == "" {
		utils.JSONError(w, api_errors.ErrMissingFields, "Missing fields", http.StatusBadRequest)
		return
	}

	user.Password = utils.HashPassword(user.Password)

	repo := repository.NewRepository(h.Db)
	err := repo.CreateUser(&user)
	if err != nil {
		slog.Error("Failed to create user", "error", err)

		// Check for duplicate key errors (PostgreSQL error codes)
		errStr := err.Error()
		if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "unique constraint") {
			if strings.Contains(errStr, "email") {
				utils.JSONError(w, api_errors.ErrDuplicateEmail, "Email already exists", http.StatusConflict)
				return
			}
			if strings.Contains(errStr, "username") {
				utils.JSONError(w, api_errors.ErrDuplicateUsername, "Username already exists", http.StatusConflict)
				return
			}
			utils.JSONError(w, api_errors.ErrUserAlreadyExists, "User already exists", http.StatusConflict)
			return
		}

		utils.JSONError(w, api_errors.ErrInternalServer, "Error creating user", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, user, http.StatusCreated)
}

// RefreshHandler godoc
// @Summary Refresh Token
// @Description Refreshes the access token using a valid refresh token
// @Tags Auth
// @Accept  json
// @Produce  json
// @Param   refreshReq body map[string]string true "Refresh Token"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/refresh [post]
func (h *AuthHandler) RefreshHandler(w http.ResponseWriter, req *http.Request) {
	var refreshReq struct {
		RefreshToken string `json:"refresh_token"`
	}
	if utils.DecodeJSONBody(w, req, &refreshReq) != nil {
		return
	}

	userID, err := h.JWTManager.ParseRefreshToken(refreshReq.RefreshToken)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInvalidToken, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	// Fetch user to get email and role for the new access token
	repo := repository.NewRepository(h.Db)
	user, err := repo.GetUserByID(userID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error fetching user", http.StatusInternalServerError)
		return
	}

	newAccessToken, err := h.JWTManager.CreateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating access token", http.StatusInternalServerError)
		return
	}

	newRefreshToken, err := h.JWTManager.CreateRefreshToken(userID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "Error generating refresh token", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, models.LoginResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, http.StatusOK)
}

// LogoutHandler godoc
// @Summary Logout
// @Description Logs out the user
// @Tags Auth
// @Accept  json
// @Produce  json
// @Success 200 {object} models.LogoutResponse
// @Router /api/logout [post]
func (h *AuthHandler) LogoutHandler(w http.ResponseWriter, req *http.Request) {
	utils.JSONSuccess(w, models.LogoutResponse{
		Message: "Logged out successfully",
	}, http.StatusOK)
}

package auth

import (
	"database/sql"
	"log/slog"
	"music-app/backend/internal/middleware"
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
		slog.Error("Failed to parse refresh token", "error", err)
		utils.JSONError(w, api_errors.ErrInvalidToken, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	// Fetch user to get email and role for the new access token
	repo := repository.NewRepository(h.Db)
	user, err := repo.GetUserByID(userID)
	if err != nil {
		slog.Error("Failed to fetch user during refresh", "userID", userID, "error", err)
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

// UpdateProfileHandler godoc
// @Summary Update Profile
// @Description Updates the user's profile information
// @Tags Auth
// @Accept  json
// @Produce  json
// @Security BearerAuth
// @Param   updateReq body models.UpdateProfileRequest true "Profile Update Data"
// @Success 200 {object} models.UpdateProfileResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 409 {object} utils.ErrorResponse
// @Router /api/profile [put]
func (h *AuthHandler) UpdateProfileHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var updateReq models.UpdateProfileRequest
	if utils.DecodeJSONBody(w, req, &updateReq) != nil {
		return
	}

	repo := repository.NewRepository(h.Db)

	// Get current user data
	currentUser, err := repo.GetUserByID(userID)
	if err != nil {
		utils.JSONError(w, api_errors.ErrUserNotFound, "User not found", http.StatusNotFound)
		return
	}

	// Use current values if not provided
	username := updateReq.Username
	if username == "" {
		username = currentUser.Username
	}

	email := updateReq.Email
	if email == "" {
		email = currentUser.Email
	}

	bio := updateReq.Bio
	if bio == nil {
		bio = currentUser.AvatarURL // Using AvatarURL field for bio temporarily
	}

	// Check if email is being changed and if it's already in use
	if email != currentUser.Email {
		exists, err := repo.CheckEmailExists(email, userID)
		if err != nil {
			slog.Error("Failed to check email existence", "error", err)
			utils.JSONError(w, api_errors.ErrInternalServer, "Error checking email", http.StatusInternalServerError)
			return
		}
		if exists {
			utils.JSONError(w, api_errors.ErrDuplicateEmail, "Email already exists", http.StatusConflict)
			return
		}
	}

	// Check if username is being changed and if it's already in use
	if username != currentUser.Username {
		exists, err := repo.CheckUsernameExists(username, userID)
		if err != nil {
			slog.Error("Failed to check username existence", "error", err)
			utils.JSONError(w, api_errors.ErrInternalServer, "Error checking username", http.StatusInternalServerError)
			return
		}
		if exists {
			utils.JSONError(w, api_errors.ErrDuplicateUsername, "Username already exists", http.StatusConflict)
			return
		}
	}

	// Update profile
	err = repo.UpdateUserProfile(userID, username, email, bio)
	if err != nil {
		slog.Error("Failed to update profile", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "Error updating profile", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, models.UpdateProfileResponse{
		Message: "Profile updated successfully",
	}, http.StatusOK)
}

// ChangePasswordHandler godoc
// @Summary Change Password
// @Description Changes the user's password
// @Tags Auth
// @Accept  json
// @Produce  json
// @Security BearerAuth
// @Param   changeReq body models.ChangePasswordRequest true "Password Change Data"
// @Success 200 {object} models.UpdateProfileResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/profile/password [put]
func (h *AuthHandler) ChangePasswordHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var changeReq models.ChangePasswordRequest
	if utils.DecodeJSONBody(w, req, &changeReq) != nil {
		return
	}

	if changeReq.CurrentPassword == "" || changeReq.NewPassword == "" {
		utils.JSONError(w, api_errors.ErrMissingFields, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Validate new password strength (at least 8 characters)
	if len(changeReq.NewPassword) < 8 {
		utils.JSONError(w, api_errors.ErrWeakPassword, "Password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	repo := repository.NewRepository(h.Db)

	// Get current password hash
	currentHash, err := repo.GetUserPasswordHash(userID)
	if err != nil {
		slog.Error("Failed to get password hash", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "Error fetching user", http.StatusInternalServerError)
		return
	}

	// Verify current password
	if !utils.CheckPasswordHash(changeReq.CurrentPassword, currentHash) {
		utils.JSONError(w, api_errors.ErrInvalidCredentials, "Current password is incorrect", http.StatusUnauthorized)
		return
	}

	// Hash new password and update
	newHash := utils.HashPassword(changeReq.NewPassword)
	err = repo.UpdateUserPassword(userID, newHash)
	if err != nil {
		slog.Error("Failed to update password", "error", err)
		utils.JSONError(w, api_errors.ErrInternalServer, "Error updating password", http.StatusInternalServerError)
		return
	}

	utils.JSONSuccess(w, models.UpdateProfileResponse{
		Message: "Password changed successfully",
	}, http.StatusOK)
}

// GetProfileHandler godoc
// @Summary Get Profile
// @Description Gets the current user's profile information
// @Tags Auth
// @Produce  json
// @Security BearerAuth
// @Success 200 {object} models.UserProfileResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /api/profile [get]
func (h *AuthHandler) GetProfileHandler(w http.ResponseWriter, req *http.Request) {
	userID, ok := middleware.GetUserID(req.Context())
	if !ok {
		utils.JSONError(w, api_errors.ErrUnauthorized, "Unauthorized", http.StatusUnauthorized)
		return
	}

	repo := repository.NewRepository(h.Db)
	user, err := repo.GetUserByID(userID)
	if err != nil {
		slog.Error("Failed to get user profile", "error", err)
		utils.JSONError(w, api_errors.ErrUserNotFound, "User not found", http.StatusNotFound)
		return
	}

	utils.JSONSuccess(w, models.UserProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		AvatarURL: user.AvatarURL,
		Role:      user.Role,
	}, http.StatusOK)
}

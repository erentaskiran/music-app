package api

import (
	"music-app/backend/internal/middleware"
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"net/http"
)

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

// GetUsersHandler godoc
// @Summary Get all users
// @Description Retrieves all users (for admin/artist selection)
// @Tags Protected
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Success 200 {array} models.User
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/users [get]
func (r *Router) GetUsersHandler(w http.ResponseWriter, req *http.Request) {
	repo := repository.NewRepository(r.Db)
	users, err := repo.GetAllUsers()
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to get users", http.StatusInternalServerError)
		return
	}
	utils.JSONSuccess(w, users, http.StatusOK)
}

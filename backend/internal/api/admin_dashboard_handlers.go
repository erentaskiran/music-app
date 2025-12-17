package api

import (
	"music-app/backend/internal/models"
	"music-app/backend/internal/repository"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
	"net/http"
	"strconv"
)

// GetAdminDashboardHandler godoc
// @Summary Get admin dashboard data
// @Description Retrieves dashboard stats and recent uploads for admin view
// @Tags Admin
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param limit query int false "Number of recent uploads to return (default 5, max 20)"
// @Success 200 {object} models.AdminDashboardResponse
// @Failure 401 {object} utils.ErrorResponse
// @Failure 403 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /api/admin/dashboard [get]
func (r *Router) GetAdminDashboardHandler(w http.ResponseWriter, req *http.Request) {
	limit := 5
	if l := req.URL.Query().Get("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
			if limit > 20 {
				limit = 20
			}
		}
	}

	repo := repository.NewRepository(r.Db)
	stats, err := repo.GetAdminDashboardStats()
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to load admin stats", http.StatusInternalServerError)
		return
	}

	recentUploads, err := repo.GetRecentUploads(limit)
	if err != nil {
		utils.JSONError(w, api_errors.ErrInternalServer, "failed to load recent uploads", http.StatusInternalServerError)
		return
	}

	response := models.AdminDashboardResponse{
		Stats:         stats,
		RecentUploads: recentUploads,
	}

	utils.JSONSuccess(w, response, http.StatusOK)
}

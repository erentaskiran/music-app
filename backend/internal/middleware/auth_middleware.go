package middleware

import (
	"database/sql"
	"log/slog"
	"net/http"
	"strings"

	"music-app/backend/internal/repository"
	utils "music-app/backend/internal/utils"
	"music-app/backend/pkg/api_errors"
)

type AuthMiddleware struct {
	JWTManager *utils.JWTManager
	Db         *sql.DB
}

func NewAuthMiddleware(jwtManager *utils.JWTManager, db *sql.DB) *AuthMiddleware {
	return &AuthMiddleware{
		JWTManager: jwtManager,
		Db:         db,
	}
}

func (m *AuthMiddleware) Authenticated(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if h == "" || !strings.HasPrefix(h, "Bearer ") {
			utils.JSONError(w, api_errors.ErrUnauthorized, "Missing bearer token", http.StatusUnauthorized)
			return
		}
		tokenString := strings.TrimPrefix(h, "Bearer ")
		claims, err := m.JWTManager.ParseAccessToken(tokenString)
		if err != nil {
			utils.JSONError(w, api_errors.ErrInvalidToken, "Invalid token", http.StatusUnauthorized)
			return
		}
		ctx := WithUserID(r.Context(), claims.UserID)
		ctx = WithUserRole(ctx, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole returns a middleware that checks if the user has the required role
// by querying the database using the user ID from JWT
func (m *AuthMiddleware) RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := GetUserID(r.Context())
			if !ok {
				utils.JSONError(w, api_errors.ErrUnauthorized, "User not authenticated", http.StatusUnauthorized)
				return
			}

			// Query database to get actual user role
			repo := repository.NewRepository(m.Db)
			userRole, err := repo.GetUserRoleByID(userID)
			if err != nil {
				slog.Error("Failed to get user role from database", "userID", userID, "error", err)
				utils.JSONError(w, api_errors.ErrInternalServer, "Failed to verify user role", http.StatusInternalServerError)
				return
			}

			if userRole != role {
				utils.JSONError(w, api_errors.ErrForbidden, "Insufficient permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireAdmin is a convenience middleware that requires the admin role
// It queries the database to verify the user's role using user ID from JWT
func (m *AuthMiddleware) RequireAdmin(next http.Handler) http.Handler {
	return m.RequireRole("admin")(next)
}

// RequireUser is a convenience middleware that requires the user role
// It queries the database to verify the user's role using user ID from JWT
func (m *AuthMiddleware) RequireUser(next http.Handler) http.Handler {
	return m.RequireRole("user")(next)
}

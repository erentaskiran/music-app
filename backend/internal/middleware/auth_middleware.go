package middleware

import (
	"net/http"
	"strings"

	utils "music-app/backend/internal/utils"
)

type AuthMiddleware struct {
	JWTManager *utils.JWTManager
}

func NewAuthMiddleware(jwtManager *utils.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{JWTManager: jwtManager}
}

func (m *AuthMiddleware) Authenticated(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if h == "" || !strings.HasPrefix(h, "Bearer ") {
			http.Error(w, "missing bearer token", http.StatusUnauthorized)
			return
		}
		tokenString := strings.TrimPrefix(h, "Bearer ")
		claims, err := m.JWTManager.ParseAccessToken(tokenString)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		ctx := WithUserID(r.Context(), claims.UserID)
		ctx = WithUserRole(ctx, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole returns a middleware that checks if the user has the required role
func (m *AuthMiddleware) RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := GetUserRole(r.Context())
			if !ok || userRole != role {
				http.Error(w, "forbidden: insufficient permissions", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAdmin is a convenience middleware that requires the admin role
func (m *AuthMiddleware) RequireAdmin(next http.Handler) http.Handler {
	return m.RequireRole("admin")(next)
}

// RequireUser is a convenience middleware that requires the user role
func (m *AuthMiddleware) RequireUser(next http.Handler) http.Handler {
	return m.RequireRole("user")(next)
}

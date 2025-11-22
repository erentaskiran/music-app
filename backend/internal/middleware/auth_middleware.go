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
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

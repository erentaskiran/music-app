package utils

import (
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTManager struct {
	secret          []byte
	accessTokenExp  time.Duration
	refreshTokenExp time.Duration
}

func NewJWTManager(secret string, accessTokenExpMinutes int, refreshTokenExpDays int) *JWTManager {
	return &JWTManager{
		secret:          []byte(secret),
		accessTokenExp:  time.Duration(accessTokenExpMinutes) * time.Minute,
		refreshTokenExp: time.Duration(refreshTokenExpDays) * 24 * time.Hour,
	}
}

type AccessTokenClaims struct {
	UserID int    `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (m *JWTManager) CreateAccessToken(userId int, email string, role string) (string, error) {
	now := time.Now()
	claims := AccessTokenClaims{
		UserID: userId,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "music-app-backend",
			Subject:   strconv.Itoa(userId),
			Audience:  []string{"music-app-frontend"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.accessTokenExp)),
			NotBefore: jwt.NewNumericDate(now),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(m.secret)
}

func (m *JWTManager) CreateRefreshToken(userId int) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"userId": userId,
		"typ":    "refresh",
		"iat":    now.Unix(),
		"exp":    now.Add(m.refreshTokenExp).Unix(),
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(m.secret)
}

func (m *JWTManager) ParseAccessToken(tokenString string) (*AccessTokenClaims, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &AccessTokenClaims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*AccessTokenClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (m *JWTManager) ParseRefreshToken(tokenString string) (int, error) {
	parsed, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil || !parsed.Valid {
		return 0, errors.New("invalid refresh token")
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid claims")
	}
	rawID, ok := claims["userId"]
	if !ok {
		return 0, errors.New("userId missing")
	}
	switch v := rawID.(type) {
	case float64:
		return int(v), nil
	case int:
		return v, nil
	default:
		return 0, errors.New("invalid userId type")
	}
}

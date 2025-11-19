package utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AccessTokenClaims struct {
	UserID int `json:"userId"`
	jwt.RegisteredClaims
}

func CreateAccessToken(userId int) (string, error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	if len(secret) == 0 {
		return "", errors.New("JWT_SECRET not set")
	}

	expMinutes := 15
	if raw := os.Getenv("ACCESS_TOKEN_EXPIRE_MINUTES"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			expMinutes = v
		}
	}

	now := time.Now()
	claims := AccessTokenClaims{
		UserID: userId,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "music-app-backend",
			Subject:   strconv.Itoa(userId),
			Audience:  []string{"music-app-frontend"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(expMinutes) * time.Minute)),
			NotBefore: jwt.NewNumericDate(now),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secret)
}

func CreateRefreshToken(userId int) (string, error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	if len(secret) == 0 {
		return "", errors.New("JWT_SECRET not set")
	}

	expDays := 7
	if raw := os.Getenv("REFRESH_TOKEN_EXPIRE_DAYS"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			expDays = v
		}
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"userId": userId,
		"typ":    "refresh",
		"iat":    now.Unix(),
		"exp":    now.Add(time.Duration(expDays) * 24 * time.Hour).Unix(),
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secret)
}

func ParseAccessToken(tokenString string) (*AccessTokenClaims, error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	parsed, err := jwt.ParseWithClaims(tokenString, &AccessTokenClaims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
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

func ParseRefreshToken(tokenString string) (int, error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	parsed, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
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

func CreateToken(userId int) (string, error) {
	return CreateAccessToken(userId)
}

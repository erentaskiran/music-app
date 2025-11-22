package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	JWTSecret       string
	AccessTokenExp  int
	RefreshTokenExp int
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:            getEnv("PORT", "8000"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		AccessTokenExp:  getEnvAsInt("ACCESS_TOKEN_EXPIRE_MINUTES", 15),
		RefreshTokenExp: getEnvAsInt("REFRESH_TOKEN_EXPIRE_DAYS", 7),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}

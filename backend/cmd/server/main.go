package main

import (
	"log/slog"
	"music-app/backend/internal/api"
	"music-app/backend/internal/utils"
	"music-app/backend/pkg/config"
	"music-app/backend/pkg/db"
	"music-app/backend/pkg/logger"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	logger.Init()

	_ = godotenv.Load()
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}

	db := db.InitDB(cfg.DatabaseURL)
	defer db.Close()

	jwtManager := utils.NewJWTManager(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)

	router := api.NewRouter(db, jwtManager, cfg)

	r := router.NewRouter()

	slog.Info("Server is running", "port", cfg.Port)

	err = http.ListenAndServe(":"+cfg.Port, r)
	if err != nil {
		slog.Error("Server failed to start", "error", err)
		os.Exit(1)
	}
}

package main

import (
	"database/sql"
	"fmt"
	"music-app/backend/internal/api"
	"music-app/backend/pkg/db"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

type App struct {
	DB *sql.DB
}

func main() {
	_ = godotenv.Load()
	DbURL := os.Getenv("DATABASE_URL")
	if DbURL == "" {
		fmt.Println("DATABASE_URL not set")
		os.Exit(1)
	}

	db := db.InitDB(DbURL)
	defer db.Close()

	portEnv := os.Getenv("PORT")
	if portEnv == "" {
		portEnv = "8000"
	}
	port := ":" + portEnv

	app := &App{DB: db}
	router := api.NewRouter(app.DB)

	r := router.NewRouter()

	fmt.Println("Server is running on port", port)

	err := http.ListenAndServe(port, r)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

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

	db := db.InitDB(DbURL)
	defer db.Close()

	port := ":" + os.Getenv("PORT")

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

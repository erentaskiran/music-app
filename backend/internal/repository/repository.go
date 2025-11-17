package repository

import "database/sql"

type Repository struct {
	Db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{
		Db: db,
	}
}

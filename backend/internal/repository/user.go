package repository

import (
	"music-app/backend/internal/models"
	utils "music-app/backend/internal/utils"
)

func (r *Repository) CreateUser(user *models.RegisterRequest) error {
	query := "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)"
	_, err := r.Db.Exec(query, user.Email, user.Username, user.Password)
	return err
}

func (r *Repository) CheckLogin(email, password string) (*models.User, error) {
	query := "SELECT id, password_hash FROM users WHERE email=$1"
	row := r.Db.QueryRow(query, email)

	var user models.User
	err := row.Scan(&user.ID, &user.PasswordHash)
	if err != nil || !utils.CheckPasswordHash(password, user.PasswordHash) {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetUserByID(userID int) (*models.User, error) {
	query := "SELECT id, email, username, avatar_url, role, created_at, updated_at FROM users WHERE id=$1"
	row := r.Db.QueryRow(query, userID)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.Username, &user.AvatarURL, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

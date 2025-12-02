package repository

import (
	"music-app/backend/internal/models"
	utils "music-app/backend/internal/utils"
)

func (r *Repository) CreateUser(user *models.RegisterRequest) error {
	role := user.Role
	if role == "" {
		role = "user"
	}
	query := "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, $4)"
	_, err := r.Db.Exec(query, user.Email, user.Username, user.Password, role)
	return err
}

func (r *Repository) CheckLogin(email, password string) (*models.User, error) {
	query := "SELECT id, email, password_hash, role FROM users WHERE email=$1"
	row := r.Db.QueryRow(query, email)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role)
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

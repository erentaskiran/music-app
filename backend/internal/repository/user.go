package repository

import (
	"music-app/backend/internal/models"
	utils "music-app/backend/internal/utils"
)

func (r *Repository) CreateUser(user *models.RegisterRequest) error {
	role := user.Role
	if role != "admin" {
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

func (r *Repository) GetUserByUsername(username string) (*models.User, error) {
	query := "SELECT id, email, username, avatar_url, role, created_at, updated_at FROM users WHERE username=$1"
	row := r.Db.QueryRow(query, username)

	var user models.User
	err := row.Scan(&user.ID, &user.Email, &user.Username, &user.AvatarURL, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) UpdateUserProfile(userID int, username, email string, bio *string) error {
	query := "UPDATE users SET username=$1, email=$2, avatar_url=$3, updated_at=NOW() WHERE id=$4"
	_, err := r.Db.Exec(query, username, email, bio, userID)
	return err
}

func (r *Repository) UpdateUserPassword(userID int, newPasswordHash string) error {
	query := "UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2"
	_, err := r.Db.Exec(query, newPasswordHash, userID)
	return err
}

func (r *Repository) GetUserPasswordHash(userID int) (string, error) {
	query := "SELECT password_hash FROM users WHERE id=$1"
	row := r.Db.QueryRow(query, userID)
	var passwordHash string
	err := row.Scan(&passwordHash)
	return passwordHash, err
}

func (r *Repository) CheckEmailExists(email string, excludeUserID int) (bool, error) {
	query := "SELECT COUNT(*) FROM users WHERE email=$1 AND id!=$2"
	var count int
	err := r.Db.QueryRow(query, email, excludeUserID).Scan(&count)
	return count > 0, err
}

func (r *Repository) CheckUsernameExists(username string, excludeUserID int) (bool, error) {
	query := "SELECT COUNT(*) FROM users WHERE username=$1 AND id!=$2"
	var count int
	err := r.Db.QueryRow(query, username, excludeUserID).Scan(&count)
	return count > 0, err
}

func (r *Repository) GetUserRoleByID(userID int) (string, error) {
	query := "SELECT role FROM users WHERE id=$1"
	row := r.Db.QueryRow(query, userID)
	var role string
	err := row.Scan(&role)
	return role, err
}

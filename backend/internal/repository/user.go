package repository

import (
	"music-app/backend/internal/models"
	utils "music-app/backend/internal/utils"
)

func (r *Repository) CreateUser(user *models.RegisterRequest) error {
	query := "INSERT INTO users (name, mail, password) VALUES ($1, $2, $3)"
	_, err := r.Db.Exec(query, user.Name, user.Mail, user.Password)
	return err
}

func (r *Repository) CheckLogin(mail, password string) (*models.User, error) {
	query := "SELECT user_id, password FROM users WHERE mail=$1"
	row := r.Db.QueryRow(query, mail)

	var user models.User
	err := row.Scan(&user.UserID, &user.Password)
	if err != nil || !utils.CheckPasswordHash(password, user.Password) {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetUserByID(userID int) (*models.User, error) {
	query := "SELECT user_id, name, mail FROM users WHERE user_id=$1"
	row := r.Db.QueryRow(query, userID)

	var user models.User
	err := row.Scan(&user.UserID, &user.Name, &user.Mail)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

package models

type User struct {
	UserID   int    `json:"user_id"`
	Name     string `json:"name"`
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	UserID   int    `json:"user_id"`
	Name     string `json:"name"`
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type RefreshResponse struct {
	AccessToken string `json:"access_token"`
}

type UserProfileResponse struct {
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
	Mail   string `json:"mail"`
}

type LogoutResponse struct {
	Message string `json:"message"`
}

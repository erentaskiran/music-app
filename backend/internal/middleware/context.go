package middleware

import "context"

type ctxKey string

const userIDKey ctxKey = "user_id"
const userRoleKey ctxKey = "user_role"

func WithUserID(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func GetUserID(ctx context.Context) (int, bool) {
	v := ctx.Value(userIDKey)
	if v == nil {
		return 0, false
	}
	id, ok := v.(int)
	return id, ok
}

func WithUserRole(ctx context.Context, role string) context.Context {
	return context.WithValue(ctx, userRoleKey, role)
}

func GetUserRole(ctx context.Context) (string, bool) {
	v := ctx.Value(userRoleKey)
	if v == nil {
		return "", false
	}
	role, ok := v.(string)
	return role, ok
}

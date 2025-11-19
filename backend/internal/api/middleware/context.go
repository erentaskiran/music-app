package middleware

import "context"

type ctxKey string

const userIDKey ctxKey = "user_id"

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

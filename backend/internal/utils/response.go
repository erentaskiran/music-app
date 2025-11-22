package utils

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type ErrorResponse struct {
	ErrorCode string `json:"error_code"`
	Message   string `json:"message"`
}

func JSONError(w http.ResponseWriter, code string, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	
	if status >= 500 {
		slog.Error("Internal Server Error", "code", code, "message", message)
	}

	err := json.NewEncoder(w).Encode(ErrorResponse{
		ErrorCode: code,
		Message:   message,
	})
	if err != nil {
		slog.Error("Failed to write error response", "error", err)
	}
}

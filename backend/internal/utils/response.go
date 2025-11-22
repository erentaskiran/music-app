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
	if status >= 500 {
		slog.Error("Internal Server Error", "code", code, "message", message)
	}

	response := ErrorResponse{
		ErrorCode: code,
		Message:   message,
	}

	w.Header().Set("Content-Type", "application/json")

	body, err := json.Marshal(response)
	if err != nil {
		slog.Error("Failed to marshal error response", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(status)
	if _, err := w.Write(body); err != nil {
		slog.Error("Failed to write error response", "error", err)
	}
}

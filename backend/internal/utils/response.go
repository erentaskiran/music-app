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

// DecodeJSONBody decodes JSON request body into the provided destination
func DecodeJSONBody(w http.ResponseWriter, r *http.Request, dst interface{}) error {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		JSONError(w, "INVALID_REQUEST", "Invalid request body", http.StatusBadRequest)
		return err
	}
	return nil
}

// JSONSuccess writes a successful JSON response
func JSONSuccess(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("Failed to encode success response", "error", err)
	}
}

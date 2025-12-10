package api_errors

const (
	// Auth errors
	ErrInvalidCredentials = "INVALID_CREDENTIALS"
	ErrInvalidToken       = "INVALID_TOKEN"
	ErrTokenExpired       = "TOKEN_EXPIRED"
	ErrUnauthorized       = "UNAUTHORIZED"
	ErrForbidden          = "FORBIDDEN"

	// User errors
	ErrUserNotFound      = "USER_NOT_FOUND"
	ErrUserAlreadyExists = "USER_ALREADY_EXISTS"
	ErrDuplicateEmail    = "DUPLICATE_EMAIL"
	ErrDuplicateUsername = "DUPLICATE_USERNAME"
	ErrInvalidEmail      = "INVALID_EMAIL"
	ErrWeakPassword      = "WEAK_PASSWORD"

	// Validation errors
	ErrMissingFields   = "MISSING_FIELDS"
	ErrInvalidRequest  = "INVALID_REQUEST"
	ErrBadRequest      = "BAD_REQUEST"
	ErrValidationError = "VALIDATION_ERROR"

	// Resource errors
	ErrNotFound       = "NOT_FOUND"
	ErrTrackNotFound  = "TRACK_NOT_FOUND"
	ErrAlbumNotFound  = "ALBUM_NOT_FOUND"
	ErrArtistNotFound = "ARTIST_NOT_FOUND"

	// Server errors
	ErrInternalServer     = "INTERNAL_SERVER_ERROR"
	ErrDatabaseError      = "DATABASE_ERROR"
	ErrServiceUnavailable = "SERVICE_UNAVAILABLE"
)

// Error messages for better user feedback
const (
	InvalidArtistID     = "Invalid artist ID"
	ArtistNotFound      = "Artist not found"
	MissingSearchQuery  = "Search query is required"
	InternalServerError = "Internal server error"
)

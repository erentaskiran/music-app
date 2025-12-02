/**
 * Error codes returned by the backend API
 */
export type ApiErrorCode =
    // Auth errors
    | 'INVALID_CREDENTIALS'
    | 'INVALID_TOKEN'
    | 'TOKEN_EXPIRED'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    // User errors
    | 'USER_NOT_FOUND'
    | 'USER_ALREADY_EXISTS'
    | 'DUPLICATE_EMAIL'
    | 'DUPLICATE_USERNAME'
    | 'INVALID_EMAIL'
    | 'WEAK_PASSWORD'
    // Validation errors
    | 'MISSING_FIELDS'
    | 'INVALID_REQUEST'
    | 'BAD_REQUEST'
    | 'VALIDATION_ERROR'
    // Resource errors
    | 'NOT_FOUND'
    | 'TRACK_NOT_FOUND'
    | 'ALBUM_NOT_FOUND'
    // Server errors
    | 'INTERNAL_SERVER_ERROR'
    | 'DATABASE_ERROR'
    | 'SERVICE_UNAVAILABLE'

/**
 * User-friendly error messages for each error code
 */
const errorMessages: Record<ApiErrorCode, string> = {
    // Auth errors
    INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    INVALID_TOKEN: 'Invalid session. Please log in again.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    UNAUTHORIZED: 'You need to log in to perform this action.',
    FORBIDDEN: 'You do not have permission to perform this action.',

    // User errors
    USER_NOT_FOUND: 'User not found.',
    USER_ALREADY_EXISTS: 'This user is already registered.',
    DUPLICATE_EMAIL: 'This email address is already in use.',
    DUPLICATE_USERNAME: 'This username is already taken.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    WEAK_PASSWORD: 'Your password is too weak. Please choose a stronger password.',

    // Validation errors
    MISSING_FIELDS: 'Please fill in all required fields.',
    INVALID_REQUEST: 'Invalid request. Please check your input.',
    BAD_REQUEST: 'Invalid request. Please check your input.',
    VALIDATION_ERROR: 'The information entered is invalid. Please check and try again.',

    // Resource errors
    NOT_FOUND: 'The requested content was not found.',
    TRACK_NOT_FOUND: 'Track not found.',
    ALBUM_NOT_FOUND: 'Album not found.',

    // Server errors
    INTERNAL_SERVER_ERROR: 'An error occurred. Please try again later.',
    DATABASE_ERROR: 'Database error. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service is currently unavailable. Please try again later.',
}

/**
 * Default error message for unknown error codes
 */
const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again.'

/**
 * API Error class with error code support
 */
export class ApiError extends Error {
    public readonly code: ApiErrorCode | string
    public readonly statusCode: number

    constructor(code: string, message: string, statusCode: number) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.statusCode = statusCode
    }

    /**
     * Get user-friendly message for this error
     */
    getUserMessage(): string {
        return getErrorMessage(this.code as ApiErrorCode)
    }
}

/**
 * Get user-friendly error message for an error code
 */
export function getErrorMessage(code: ApiErrorCode | string): string {
    if (code in errorMessages) {
        return errorMessages[code as ApiErrorCode]
    }
    return DEFAULT_ERROR_MESSAGE
}

/**
 * Parse error response from API and return ApiError
 */
export function parseApiError(response: { error_code?: string; message?: string }, statusCode: number): ApiError {
    const code = response.error_code || 'INTERNAL_SERVER_ERROR'
    const message = response.message || DEFAULT_ERROR_MESSAGE
    return new ApiError(code, message, statusCode)
}

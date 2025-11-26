import Cookies from 'js-cookie'

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api`

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>
}

export async function makeRequest(url: string, options: RequestOptions = {}) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (options.body instanceof FormData) {
        delete defaultHeaders['Content-Type']
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    }

    const response = await fetch(fullUrl, config)

    if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'An error occurred. Please try again.'

        try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
            // If response is not JSON, use status-based messages
            if (response.status === 400) {
                errorMessage = 'Invalid request. Please check your input.'
            } else if (response.status === 401) {
                errorMessage = 'Invalid credentials. Please try again.'
            } else if (response.status === 403) {
                errorMessage = 'You do not have permission to perform this action.'
            } else if (response.status === 404) {
                errorMessage = 'The requested resource was not found.'
            } else if (response.status === 409) {
                errorMessage = 'This resource already exists.'
            } else if (response.status >= 500) {
                errorMessage = 'Server error. Please try again later.'
            }
        }

        throw new Error(errorMessage)
    }

    return response.json()
}

/**
 * Refreshes the access token using the refresh token
 * Automatically called when access token expires
 */
export async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = Cookies.get('refresh_token')

        if (!refreshToken) {
            return null
        }

        const response = await makeRequest('/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        })

        // Store the new access token
        if (response.access_token) {
            Cookies.set('jwt', response.access_token, { expires: 7 })
        }

        // Store the new refresh token if provided
        if (response.refresh_token) {
            Cookies.set('refresh_token', response.refresh_token, { expires: 30 })
        }

        return response.access_token
    } catch (error) {
        // Log error but don't show in console if it's just an expired token
        if (error instanceof Error && !error.message.includes('401')) {
            console.error('Token refresh failed:', error)
        }
        // If refresh fails, clear tokens and redirect to login
        Cookies.remove('jwt')
        Cookies.remove('refresh_token')
        return null
    }
}

/**
 * Makes an authenticated request with automatic token refresh on 401 errors
 * If the access token is expired, it will automatically refresh and retry the request
 */
export async function makeAuthenticatedRequest(url: string, options: RequestOptions = {}) {
    const token = Cookies.get('jwt')

    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    try {
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers,
        }

        if (options.body instanceof FormData) {
            delete requestHeaders['Content-Type']
        }

        // First attempt with current token
        const response = await fetch(
            url.startsWith('http') ? url : `${BASE_URL}${url}`,
            {
                ...options,
                headers: requestHeaders,
            }
        )

        // If we get 401 Unauthorized, try to refresh the token
        if (response.status === 401) {
            const newToken = await refreshAccessToken()

            if (!newToken) {
                // Refresh failed, throw error to redirect to login
                throw new Error('Session expired. Please login again.')
            }

            const retryHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
            }

            if (options.body instanceof FormData) {
                delete retryHeaders['Content-Type']
            }

            // Retry the request with new token
            const retryResponse = await fetch(
                url.startsWith('http') ? url : `${BASE_URL}${url}`,
                {
                    ...options,
                    headers: retryHeaders,
                }
            )

            if (!retryResponse.ok) {
                // Get user-friendly error message
                let errorMessage = 'An error occurred. Please try again.'
                try {
                    const errorData = await retryResponse.json()
                    errorMessage = errorData.message || errorData.error || errorMessage
                } catch {
                    if (retryResponse.status === 403) {
                        errorMessage = 'You do not have permission to access this resource.'
                    } else if (retryResponse.status >= 500) {
                        errorMessage = 'Server error. Please try again later.'
                    }
                }
                throw new Error(errorMessage)
            }

            return retryResponse.json()
        }

        if (!response.ok) {
            // Get user-friendly error message
            let errorMessage = 'An error occurred. Please try again.'
            try {
                const errorData = await response.json()
                errorMessage = errorData.message || errorData.error || errorMessage
            } catch {
                if (response.status === 403) {
                    errorMessage = 'You do not have permission to access this resource.'
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later.'
                }
            }
            throw new Error(errorMessage)
        }

        return response.json()
    } catch (error) {
        // Only log if it's not a 401 (token refresh will handle that)
        if (error instanceof Error && !error.message.includes('401')) {
            console.error('Authenticated request failed:', error)
        }
        throw error
    }
}

// Authentication API Types
export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    email: string
    username: string
    password: string
}

export interface AuthResponse {
    access_token: string
    refresh_token: string
}

/**
 * Logs in a user with email and password
 * On success, stores the JWT token in cookies
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await makeRequest('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    })

    // Store the access token in cookies for subsequent authenticated requests
    if (response.access_token) {
        Cookies.set('jwt', response.access_token, { expires: 7 }) // expires in 7 days
    }

    // Store refresh token as well (optional, for token refresh functionality)
    if (response.refresh_token) {
        Cookies.set('refresh_token', response.refresh_token, { expires: 30 }) // expires in 30 days
    }

    return response
}

/**
 * Registers a new user
 * Returns the created user data
 */
export async function register(credentials: RegisterCredentials): Promise<void> {
    await makeRequest('/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
    })
}

/**
 * Logs out the current user
 * Removes JWT tokens from cookies
 */
export async function logout(): Promise<void> {
    try {
        // Optional: call backend logout endpoint if needed
        await makeAuthenticatedRequest('/logout', {
            method: 'POST',
        })
    } catch (error) {
        // Continue with logout even if backend call fails
        console.error('Logout API call failed:', error)
    } finally {
        // Always remove tokens from cookies
        Cookies.remove('jwt')
        Cookies.remove('refresh_token')
    }
}

/**
 * Checks if user is authenticated by verifying JWT token existence
 */
export function isAuthenticated(): boolean {
    return !!Cookies.get('jwt')
}

/**
 * Track type definition
 */
export interface TrackResponse {
    id: number
    title: string
    artist_id: number
    artist_name: string
    file_url: string
    duration?: number
    cover_image_url?: string
    genre?: string
    lyrics?: string
    quality_bitrate?: number
    status: string
    created_at: string
    updated_at: string
}

/**
 * Fetches all published tracks
 */
export async function getTracks(limit = 50, offset = 0): Promise<TrackResponse[]> {
    return makeRequest(`/tracks?limit=${limit}&offset=${offset}`, {
        method: 'GET',
    })
}

/**
 * Gets the streaming URL for a track
 */
export function getTrackStreamUrl(trackId: number): string {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    return `${baseUrl}/api/tracks/${trackId}/stream`
}

import Cookies from 'js-cookie'

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api`

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>
}

export async function makeRequest(url: string, options: RequestOptions = {}) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

    const defaultHeaders = {
        'Content-Type': 'application/json',
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
        throw new Error(`Request failed with status ${response.status}`)
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
        // First attempt with current token
        const response = await fetch(
            url.startsWith('http') ? url : `${BASE_URL}${url}`,
            {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            }
        )

        // If we get 401 Unauthorized, try to refresh the token
        if (response.status === 401) {
            const newToken = await refreshAccessToken()
            
            if (!newToken) {
                // Refresh failed, throw error to redirect to login
                throw new Error('Session expired. Please login again.')
            }

            // Retry the request with new token
            const retryResponse = await fetch(
                url.startsWith('http') ? url : `${BASE_URL}${url}`,
                {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers,
                        Authorization: `Bearer ${newToken}`,
                    },
                }
            )

            if (!retryResponse.ok) {
                throw new Error(`Request failed with status ${retryResponse.status}`)
            }

            return retryResponse.json()
        }

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
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

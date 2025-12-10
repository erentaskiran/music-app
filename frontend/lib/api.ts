import Cookies from 'js-cookie'
import { Playlist, PlaylistWithTracks } from '@/lib/types'
import type { JWTPayload, UserRole } from './types'
import { ApiError, getErrorMessage } from './errors'

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
        let errorCode = 'INTERNAL_SERVER_ERROR'
        let errorMessage = 'An error occurred. Please try again.'

        try {
            const errorData = await response.json()
            errorCode = errorData.error_code || errorCode
            errorMessage = getErrorMessage(errorCode)
        } catch {
            // If response is not JSON, use status-based error codes
            if (response.status === 400) {
                errorCode = 'BAD_REQUEST'
            } else if (response.status === 401) {
                errorCode = 'UNAUTHORIZED'
            } else if (response.status === 403) {
                errorCode = 'FORBIDDEN'
            } else if (response.status === 404) {
                errorCode = 'NOT_FOUND'
            } else if (response.status === 409) {
                errorCode = 'USER_ALREADY_EXISTS'
            } else if (response.status >= 500) {
                errorCode = 'INTERNAL_SERVER_ERROR'
            }
            errorMessage = getErrorMessage(errorCode)
        }

        throw new ApiError(errorCode, errorMessage, response.status)
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
            console.warn('No refresh token found in cookies')
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
        console.error('Token refresh failed:', error)
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
                throw new ApiError('TOKEN_EXPIRED', getErrorMessage('TOKEN_EXPIRED'), 401)
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
                let errorCode = 'INTERNAL_SERVER_ERROR'
                let errorMessage = ''
                try {
                    const errorData = await retryResponse.json()
                    errorCode = errorData.error_code || errorCode
                    errorMessage = errorData.message
                } catch {
                    if (retryResponse.status === 403) {
                        errorCode = 'FORBIDDEN'
                    } else if (retryResponse.status >= 500) {
                        errorCode = 'INTERNAL_SERVER_ERROR'
                    }
                }
                throw new ApiError(errorCode, errorMessage || getErrorMessage(errorCode), retryResponse.status)
            }

            return retryResponse.json()
        }

        if (!response.ok) {
            let errorCode = 'INTERNAL_SERVER_ERROR'
            let errorMessage = ''
            try {
                const errorData = await response.json()
                errorCode = errorData.error_code || errorCode
                errorMessage = errorData.message
            } catch {
                if (response.status === 403) {
                    errorCode = 'FORBIDDEN'
                } else if (response.status >= 500) {
                    errorCode = 'INTERNAL_SERVER_ERROR'
                }
            }
            throw new ApiError(errorCode, errorMessage || getErrorMessage(errorCode), response.status)
        }

        // Handle 204 No Content - return empty object
        if (response.status === 204) {
            return {}
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
    role?: 'user' | 'admin'
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
 * Decodes a JWT token without verifying the signature
 * Note: This is safe for client-side use as the server validates the token
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }
        const payload = parts[1]
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decoded) as JWTPayload
    } catch {
        return null
    }
}

/**
 * Gets the current user's role from the JWT token
 */
export function getUserRole(): UserRole | null {
    const token = Cookies.get('jwt')
    if (!token) {
        return null
    }
    const payload = decodeJWT(token)
    return payload?.role ?? null
}

/**
 * Gets the current user info from the JWT token
 */
export function getCurrentUser(): { id: number; email: string; role: UserRole } | null {
    const token = Cookies.get('jwt')
    if (!token) {
        return null
    }
    const payload = decodeJWT(token)
    if (!payload) {
        return null
    }
    return {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
    }
}

/**
 * Checks if the current user has admin role
 */
export function isAdmin(): boolean {
    return getUserRole() === 'admin'
}

/**
 * Checks if the current user has user role
 */
export function isUser(): boolean {
    return getUserRole() === 'user'
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
    is_favorited?: boolean
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
 * Fetches tracks uploaded by the current user
 */
export async function getMyTracks(limit = 50, offset = 0): Promise<TrackResponse[]> {
    return makeAuthenticatedRequest(`/my-tracks?limit=${limit}&offset=${offset}`, {
        method: 'GET',
    })
}

/**
 * Deletes a track owned by the current user
 */
export async function deleteTrack(trackId: number): Promise<void> {
    return makeAuthenticatedRequest(`/my-tracks/${trackId}`, {
        method: 'DELETE',
    })
}

/**
 * Updates a track's details
 */
export interface UpdateTrackData {
    title: string
    genre?: string | null
    cover_image_url?: string | null
}

export async function updateTrack(trackId: number, data: UpdateTrackData): Promise<TrackResponse> {
    return makeAuthenticatedRequest(`/my-tracks/${trackId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

/**
 * Gets the streaming URL for a track
 */
export function getTrackStreamUrl(trackId: number): string {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    return `${baseUrl}/api/tracks/${trackId}/stream`
}

/**
 * Recently played track response from API
 */
export interface RecentlyPlayedResponse {
    id: number
    title: string
    artist_id: number
    artist_name: string
    file_url: string
    duration?: number
    cover_image_url?: string
    genre?: string
    status: string
    played_at: string
    is_favorited?: boolean
}

/**
 * Fetches the user's recently played tracks
 * Requires authentication
 */
export async function getRecentlyPlayed(limit = 20): Promise<RecentlyPlayedResponse[]> {
    return makeAuthenticatedRequest(`/history/recently-played?limit=${limit}`, {
        method: 'GET',
    })
}

/**
 * Records that a track was played
 * Requires authentication
 */
export async function recordListen(trackId: number, listenDuration?: number): Promise<void> {
    return makeAuthenticatedRequest('/history/listen', {
        method: 'POST',
        body: JSON.stringify({
            track_id: trackId,
            listen_duration: listenDuration || 0,
            device: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        }),
    })
}

/**
 * Clears the user's listening history
 * Requires authentication
 */
export async function clearHistory(): Promise<void> {
    return makeAuthenticatedRequest('/history/clear', {
        method: 'DELETE',
        
    })
}

/**
 * Searches for tracks by title, artist, or genre
 */
export async function searchTracks(query: string, limit = 50, offset = 0): Promise<TrackResponse[]> {
    return makeRequest(`/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
    })
}

/**
 * Searches for users (artists)
 */
export async function searchUsers(query: string): Promise<ProfileResponse[]> {
    return makeRequest(`/search/users?q=${encodeURIComponent(query)}`, {
        method: 'GET',
    })
}

/**
 * Creates a new playlist
 * Requires authentication
 */
export async function createPlaylist(title: string, privacy = 'public'): Promise<Playlist> {
    return makeAuthenticatedRequest('/playlists', {
        method: 'POST',
        body: JSON.stringify({ title, privacy }),
    })
}

/**
 * Gets all playlists for the current user
 * Requires authentication
 */
export async function getUserPlaylists(): Promise<Playlist[]> {
    return makeAuthenticatedRequest('/playlists', {
        method: 'GET',
    })
}

/**
 * Gets a specific playlist with all its tracks
 */
export async function getPlaylist(playlistId: number): Promise<PlaylistWithTracks> {
    return makeAuthenticatedRequest(`/playlists/${playlistId}`, {
        method: 'GET',
    })
}

/**
 * Updates a playlist (title and privacy)
 * Requires authentication and must be playlist creator
 */
export async function updatePlaylist(
    playlistId: number,
    title?: string,
    privacy?: string
): Promise<Playlist> {
    const body: Record<string, string> = {}
    if (title) body.title = title
    if (privacy) body.privacy = privacy

    return makeAuthenticatedRequest(`/playlists/${playlistId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    })
}

/**
 * Deletes a playlist
 * Requires authentication and must be playlist creator
 */
export async function deletePlaylist(playlistId: number): Promise<void> {
    return makeAuthenticatedRequest(`/playlists/${playlistId}`, {
        method: 'DELETE',
    })
}

/**
 * Get all albums
 */
export async function getAlbums() {
    return makeRequest('/albums')
}

/**
 * Get album by ID
 */
export async function getAlbum(id: number) {
    return makeRequest(`/albums/${id}`)
}

/**
 * Delete album
 */
export async function deleteAlbum(id: number) {
    return makeAuthenticatedRequest(`/albums/${id}`, {
        method: 'DELETE',
    })
}

/**
 * Add track to album
 */
export async function addTrackToAlbum(albumId: number, trackId: number) {
    return makeAuthenticatedRequest(`/albums/${albumId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ track_id: trackId }),
    })
}

/**
 * Remove track from album
 */
export async function removeTrackFromAlbum(albumId: number, trackId: number) {
    return makeAuthenticatedRequest(`/albums/${albumId}/tracks/${trackId}`, {
        method: 'DELETE',
    })
}

/**
 * Creates a new album
 * Requires authentication (Admin)
 */
export async function createAlbum(data: FormData) {
    return makeAuthenticatedRequest('/albums', {
        method: 'POST',
        body: data,
    })
}

/**
 * Adds a track to a playlist
 * Requires authentication and must be playlist creator
 */
export async function addTrackToPlaylist(playlistId: number, trackId: number): Promise<void> {
    return makeAuthenticatedRequest(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ track_id: trackId }),
    })
}

/**
 * Removes a track from a playlist
 * Requires authentication and must be playlist creator
 */
export async function removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void> {
    return makeAuthenticatedRequest(`/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE',
    })
}

/**
 * Profile response from API
 */
export interface ProfileResponse {
    id: number
    email: string
    username: string
    avatar_url?: string
    role: string
}

/**
 * Update profile request data
 */
export interface UpdateProfileData {
    username?: string
    email?: string
    bio?: string
}

/**
 * Change password request data
 */
export interface ChangePasswordData {
    current_password: string
    new_password: string
}

/**
 * Gets the current user's profile
 * Requires authentication
 */
export async function getProfile(): Promise<ProfileResponse> {
    return makeAuthenticatedRequest('/profile', {
        method: 'GET',
    })
}

/**
 * Updates the current user's profile
 * Requires authentication
 */
export async function updateProfile(data: UpdateProfileData): Promise<{ message: string }> {
    return makeAuthenticatedRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

/**
 * Changes the current user's password
 * Requires authentication
 */
export async function changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return makeAuthenticatedRequest('/profile/password', {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

/**
 * Like a track (add to favorites)
 */
export async function likeTrack(trackId: number): Promise<void> {
    return makeAuthenticatedRequest(`/tracks/${trackId}/like`, {
        method: 'POST',
    })
}

/**
 * Unlike a track (remove from favorites)
 */
export async function unlikeTrack(trackId: number): Promise<void> {
    return makeAuthenticatedRequest(`/tracks/${trackId}/unlike`, {
        method: 'POST',
    })
}

/**
 * Get user's favorite tracks
 */
export async function getUserFavorites(limit = 50, offset = 0): Promise<TrackResponse[]> {
    return makeAuthenticatedRequest(`/favorites?limit=${limit}&offset=${offset}`, {
        method: 'GET',
    })
}

// =====================
// Artist API Functions
// =====================

/**
 * Gets detailed information about a specific artist
 */
export async function getArtistDetails(artistId: number) {
    return makeRequest(`/artists/${artistId}`, {
        method: 'GET',
    })
}

/**
 * Gets an artist's top tracks based on listen count
 */
export async function getArtistTopTracks(artistId: number, limit = 10) {
    const token = Cookies.get('jwt')
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    
    return makeRequest(`/artists/${artistId}/top-tracks?limit=${limit}`, {
        method: 'GET',
        headers,
    })
}

/**
 * Gets all albums for a specific artist
 */
export async function getArtistAlbums(artistId: number) {
    return makeRequest(`/artists/${artistId}/albums`, {
        method: 'GET',
    })
}

/**
 * Gets all tracks for a specific artist
 */
export async function getArtistTracks(artistId: number) {
    const token = Cookies.get('jwt')
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    
    return makeRequest(`/artists/${artistId}/tracks`, {
        method: 'GET',
        headers,
    })
}

/**
 * Searches for artists by username
 */
export async function searchArtists(query: string, limit = 20) {
    return makeRequest(`/search/artists?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
    })
}

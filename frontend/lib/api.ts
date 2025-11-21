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

export async function makeAuthenticatedRequest(url: string, options: RequestOptions = {}) {
    const token = Cookies.get('jwt')

    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    return makeRequest(url, { ...options, headers })
}

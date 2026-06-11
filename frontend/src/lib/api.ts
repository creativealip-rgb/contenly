import type { ApiErrorPayload, AuthResponse } from '../types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://contenly.app/api/v1'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type RequestBody = unknown

async function parseError(response: Response): Promise<ApiErrorPayload> {
    const fallback: ApiErrorPayload = {
        message: response.statusText || 'An unknown error occurred',
        code: `HTTP_${response.status}`,
    }

    try {
        const payload = (await response.json()) as Partial<ApiErrorPayload>
        return {
            message: payload.message || fallback.message,
            code: payload.code || fallback.code,
            details: payload.details,
        }
    } catch {
        return fallback
    }
}

async function request<T>(endpoint: string, method: RequestMethod, body?: RequestBody): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    }

    const config: RequestInit = {
        method,
        headers,
        credentials: 'include', // Important for Better Auth session cookies
    }

    if (body !== undefined) {
        config.body = JSON.stringify(body)
    }

    const response = await fetch(`${API_URL}${endpoint}`, config)

    if (!response.ok) {
        const error = await parseError(response)
        throw new Error(error.message)
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

export const api = {
    // Generic HTTP methods
    get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
    post: <T>(endpoint: string, body?: RequestBody) => request<T>(endpoint, 'POST', body),
    put: <T>(endpoint: string, body?: RequestBody) => request<T>(endpoint, 'PUT', body),
    patch: <T>(endpoint: string, body?: RequestBody) => request<T>(endpoint, 'PATCH', body),
    delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),

    // Auth specific methods
    auth: {
        register: (data: { email: string; password: string; fullName: string }) =>
            request<AuthResponse>('/auth/register', 'POST', data),

        login: (data: { email: string; password: string }) =>
            request<AuthResponse>('/auth/login', 'POST', data),

        forgotPassword: (data: { email: string }) =>
            request<void>('/auth/forgot-password', 'POST', data),

        resetPassword: (data: { token: string; password: string }) =>
            request<void>('/auth/reset-password', 'POST', data),

        signInSocial: (provider: 'google' | 'github') => {
            window.location.href = `${API_URL}/auth/${provider}`
        },
    },
}

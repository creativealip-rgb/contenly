
interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface AuthResponse {
    user: User;
    session: {
        token: string;
        expiresAt: string;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function request<T>(endpoint: string, method: RequestMethod, body?: any): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        method,
        headers,
        credentials: 'include', // Important for Better Auth session cookies
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(error.message || `Request failed: ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const api = {
    // Generic HTTP methods
    get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
    post: <T>(endpoint: string, body?: any) => request<T>(endpoint, 'POST', body),
    put: <T>(endpoint: string, body?: any) => request<T>(endpoint, 'PUT', body),
    patch: <T>(endpoint: string, body?: any) => request<T>(endpoint, 'PATCH', body),
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
            window.location.href = `${API_URL}/auth/${provider}`;
        },
    },
};


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

export const api = {
    auth: {
        register: async (data: { email: string; password: string; fullName: string }): Promise<AuthResponse> => {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            return response.json();
        },

        login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            return response.json();
        },

        forgotPassword: async (data: { email: string }): Promise<void> => {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to send reset email');
            }
        },

        resetPassword: async (data: { token: string; password: string }): Promise<void> => {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reset password');
            }
        },

        signInSocial: (provider: 'google' | 'github') => {
            window.location.href = `${API_URL}/auth/${provider}`;
        },
    },
};

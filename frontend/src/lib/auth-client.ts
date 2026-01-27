import { createAuthClient } from "better-auth/client";

// Direct backend URL for auth to ensure cookies are set on the correct domain
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Remove trailing slash if present
const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
console.log('📡 Auth Client: Using API_URL:', API_URL);

export const authClient = createAuthClient({
    baseURL: `${API_URL}/auth`, // Direct connection to backend
});

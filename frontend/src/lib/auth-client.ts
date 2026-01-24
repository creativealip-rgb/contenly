import { createAuthClient } from "better-auth/client";

// Direct backend URL for auth to ensure cookies are set on the correct domain
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const authClient = createAuthClient({
    baseURL: `${API_URL}/auth`, // Direct connection to backend
});

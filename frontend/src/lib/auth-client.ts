import { createAuthClient } from "better-auth/client";

// Use frontend URL for consistency - all requests go through Next.js proxy
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const authClient = createAuthClient({
    baseURL: `${FRONTEND_URL}/api/auth`, // Goes through Next.js proxy -> backend
});

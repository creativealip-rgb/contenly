import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, schema } from '../db';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            ...schema,
        },
    }),

    // Base URL for the auth server
    baseURL: process.env.API_URL || 'http://localhost:3001',

    // Debug logging
    logger: {
        level: 'debug',
    },

    // Trusted origins for CORS
    trustedOrigins: [
        'http://localhost:3000',  // Frontend dev server
        'http://localhost:3001',  // Backend server
        'https://contenly.vercel.app', // Explicitly add production URL
        ...(process.env.FRONTEND_URL?.split(',') || []),  // Production/staging URLs
    ],

    // Secret for signing tokens
    secret: process.env.BETTER_AUTH_SECRET,

    // Email and Password authentication
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        requireEmailVerification: false, // Set to true in production
    },

    // OAuth providers
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        },
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },

    // User configuration
    user: {
        additionalFields: {
            role: {
                type: 'string',
                required: false,
                defaultValue: 'USER',
            },
            preferences: {
                type: 'string',
                required: false,
                defaultValue: '{}',
            },
        },
        changeEmail: {
            enabled: true,
        },
    },

    // Account configuration
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google', 'github'],
        },
    },

    // Rate limiting
    rateLimit: {
        window: 60, // 1 minute
        max: 100, // 100 requests per minute
    },

    // Callbacks
    callbacks: {
        onUserCreated: async (user) => {
            // Create initial token balance for new users
            console.log('New user created:', user.id);
            // This would be handled by the billing service
        },
    },
    // Advanced configuration
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: process.env.NODE_ENV === 'production',
        },
    },
});

console.log('🔐 Better Auth initialized');
console.log('📍 Google OAuth:', {
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'MISSING'
});

export type Auth = typeof auth;

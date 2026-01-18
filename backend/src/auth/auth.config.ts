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
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
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
});

export type Auth = typeof auth;

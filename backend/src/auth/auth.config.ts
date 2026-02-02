import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, schema } from '../db';
import { Resend } from 'resend';

console.log('🔐 Better Auth initializing...');
const rawBaseUrl = process.env.API_URL || 'http://localhost:3001';
const API_BASE_URL = rawBaseUrl.endsWith('/')
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;
const BETTER_AUTH_URL = API_BASE_URL.endsWith('/auth')
  ? API_BASE_URL
  : `${API_BASE_URL}/auth`;

console.log('📍 Better Auth URL:', BETTER_AUTH_URL);
console.log('📍 Trusted Origins:', [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://contenly.vercel.app',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : []),
]);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
    },
  }),

  // Base URL for the auth server
  baseURL: BETTER_AUTH_URL,

  // Debug logging
  logger: {
    level: 'debug',
  },

  // Trusted origins for CORS
  trustedOrigins: [
    'http://localhost:3000', // Frontend dev server
    'http://localhost:3001', // Backend server
    'https://contenly.vercel.app', // Explicitly add production URL
    ...(process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
      : []),
  ],

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,

  // Email and Password authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // Set to true in production
    sendResetPassword: async ({ user, url, token }) => {
      if (!process.env.RESEND_API_KEY) {
        console.warn(
          '⚠️ RESEND_API_KEY not set, cannot send password reset email',
        );
        return;
      }
      const fromEmail = process.env.FROM_EMAIL || 'noreply@contenly.app';
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        resend.emails
          .send({
            from: fromEmail,
            to: user.email,
            subject: 'Reset your Contently password',
            html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p>`,
          })
          .catch((err) => {
            console.error('Failed to send password reset email:', err);
          });
        console.log(`✅ Password reset email queued for ${user.email}`);
      } catch (error) {
        console.error('Error queuing password reset email:', error);
      }
    },
  },

  // Email verification
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      if (!process.env.RESEND_API_KEY) {
        console.warn(
          '⚠️ RESEND_API_KEY not set, cannot send verification email',
        );
        return;
      }
      const fromEmail = process.env.FROM_EMAIL || 'noreply@contenly.app';
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        resend.emails
          .send({
            from: fromEmail,
            to: user.email,
            subject: 'Verify your Contently account',
            html: `<p>Click the link below to verify your email:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
          })
          .catch((err) => {
            console.error('Failed to send verification email:', err);
          });
        console.log(`✅ Verification email queued for ${user.email}`);
      } catch (error) {
        console.error('Error queuing verification email:', error);
      }
    },
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

      // Send welcome email (non-blocking)
      if (process.env.RESEND_API_KEY && user.email) {
        const fromEmail = process.env.FROM_EMAIL || 'noreply@contenly.app';
        const resend = new Resend(process.env.RESEND_API_KEY);
        try {
          resend.emails
            .send({
              from: fromEmail,
              to: user.email,
              subject: 'Welcome to Contently!',
              html: `<p>Welcome to Contently! Your account has been successfully created.</p><p>You can now start creating amazing content with AI.</p>`,
            })
            .catch((err) => {
              console.error('Failed to send welcome email:', err);
            });
          console.log(`✅ Welcome email queued for ${user.email}`);
        } catch (error) {
          console.error('Error queuing welcome email:', error);
        }
      }
    },
  },
  // Advanced configuration
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true, // Required for SameSite: None, works on localhost too
    },
  },
});

console.log('🔐 Better Auth initialized');
console.log('📍 Google OAuth:', {
  enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  clientId: process.env.GOOGLE_CLIENT_ID
    ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...`
    : 'MISSING',
});

export type Auth = typeof auth;

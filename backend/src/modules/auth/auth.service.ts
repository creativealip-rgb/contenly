import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { auth } from '../../auth/auth.config';
import { db, schema } from '../../db';
import { eq, and, gt } from 'drizzle-orm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class AuthService {
  constructor(private billingService: BillingService) {}

  async signUp(data: { email: string; password: string; name?: string }) {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name || data.email.split('@')[0],
        },
      });

      // Create initial token balance for new user
      if (result.user) {
        await this.billingService.initializeBalance(result.user.id);
      }

      return {
        user: result.user,
        session: (result as any).session,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async signIn(data: { email: string; password: string }) {
    try {
      const result = await auth.api.signInEmail({
        body: {
          email: data.email,
          password: data.password,
        },
      });

      return {
        user: result.user,
        session: (result as any).session,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async signOut(sessionToken: string) {
    try {
      await auth.api.signOut({
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      return { message: 'Logged out successfully' };
    } catch {
      return { message: 'Logged out successfully' };
    }
  }

  async getSession(options: { headers: Headers }) {
    try {
      // Debug Headers
      const authHeader = options.headers.get('authorization');
      const cookieHeader = options.headers.get('cookie');
      const originHeader = options.headers.get('origin');
      const hostHeader = options.headers.get('host');
      console.log(`[SessionAuthGuard] Host: ${hostHeader}`);
      console.log(`[SessionAuthGuard] Origin: ${originHeader}`);
      console.log(`[SessionAuthGuard] Auth Header Present: ${!!authHeader}`);
      console.log(
        `[SessionAuthGuard] Cookie Header Present: ${!!cookieHeader}`,
      );
      const session = await auth.api.getSession({
        headers: options.headers,
      });
      return session;
    } catch (error: any) {
      console.error('[AuthService] getSession Error:', error);
      throw new UnauthorizedException(
        `DEBUG: getSession Error: ${error.message || 'Unknown'}`,
      );
    }
  }

  async forgotPassword(email: string) {
    try {
      // Check if user exists
      const existingUser = await db.query.user.findFirst({
        where: eq(schema.user.email, email),
      });

      if (!existingUser) {
        // Return success even if user doesn't exist for security
        return { message: 'Password reset email sent' };
      }

      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      // Store in verification table
      await db.insert(schema.verification).values({
        id: crypto.randomUUID(),
        identifier: email,
        value: token,
        expiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // MOCK EMAIL SENDING
      console.log(
        '=================================================================',
      );
      console.log(`🔐 PASSWORD RESET LINK for ${email}:`);
      console.log(
        `${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000'}/reset-password?token=${token}`,
      );
      console.log(
        '=================================================================',
      );

      return { message: 'Password reset email sent' };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return { message: 'Password reset email sent' };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Find valid token
      const validToken = await db.query.verification.findFirst({
        where: and(
          eq(schema.verification.value, token),
          gt(schema.verification.expiresAt, new Date()),
        ),
      });

      if (!validToken) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Find user
      const user = await db.query.user.findFirst({
        where: eq(schema.user.email, validToken.identifier),
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update account password
      // Note: Better Auth stores password in the account table
      await db
        .update(schema.account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(schema.account.userId, user.id));

      // Delete used token
      await db
        .delete(schema.verification)
        .where(eq(schema.verification.id, validToken.id));

      return { message: 'Password updated successfully' };
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to reset password');
    }
  }

  getOAuthUrl(provider: 'google' | 'github') {
    return `${process.env.API_URL}/api/auth/${provider}`;
  }
}

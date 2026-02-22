import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth } from '../../auth/auth.config';
import { db, schema } from '../../db';
import { eq, and, gt } from 'drizzle-orm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { BillingService } from '../billing/billing.service';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private resend: Resend | null = null;

  constructor(
    private billingService: BillingService,
    private configService: ConfigService,
  ) {
    // Initialize Resend if API key is provided
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not set - password reset emails will only be logged');
    }
  }

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
      this.logger.log(`[SessionAuthGuard] Host: ${hostHeader}`);
      this.logger.log(`[SessionAuthGuard] Origin: ${originHeader}`);
      this.logger.log(`[SessionAuthGuard] Auth Header Present: ${!!authHeader}`);
      this.logger.log(
        `[SessionAuthGuard] Cookie Header Present: ${!!cookieHeader}`,
      );
      const session = await auth.api.getSession({
        headers: options.headers,
      });
      return session;
    } catch (error: any) {
      this.logger.error('[AuthService] getSession Error:', error);
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

      // Send password reset email
      const resetUrl = `${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000'}/reset-password?token=${token}`;
      await this.sendPasswordResetEmail(email, resetUrl);

      return { message: 'Password reset email sent' };
    } catch (error: any) {
      this.logger.error('Forgot password error', error);
      return { message: 'Password reset email sent' };
    }
  }

  private async sendPasswordResetEmail(email: string, resetUrl: string) {
    const emailFrom = this.configService.get<string>('EMAIL_FROM') || 'noreply@contenly.app';

    // If Resend is configured, send actual email
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: emailFrom,
          to: email,
          subject: 'Password Reset - Contently',
          html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Password Reset</title>
                        </head>
                        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
                            </div>
                            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
                                <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                                <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password for your Contently account.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
                                </div>
                                <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Or copy and paste this link into your browser:</p>
                                <p style="font-size: 12px; color: #0ea5e9; word-break: break-all; background: #e0f2fe; padding: 10px; border-radius: 6px;">${resetUrl}</p>
                                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
                                    ⏰ This link will expire in <strong>1 hour</strong>.<br>
                                    If you didn't request this password reset, you can safely ignore this email.
                                </p>
                            </div>
                            <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
                                <p>© ${new Date().getFullYear()} Contently. All rights reserved.</p>
                            </div>
                        </body>
                        </html>
                    `,
        });
        this.logger.log(`Password reset email sent to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send password reset email to ${email}`, error);
      }
    } else {
      console.log(
        '=================================================================',
      );
      console.log(`🔐 PASSWORD RESET LINK for ${email}:`);
      console.log(resetUrl);
      console.log(
        '=================================================================',
      );
      this.logger.warn('Email not sent - RESEND_API_KEY not configured');
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

      this.logger.log(`Password reset successful for user: ${user.id}`);
      return { message: 'Password updated successfully' };
    } catch (error: any) {
      this.logger.error('Reset password error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to reset password');
    }
  }

  getOAuthUrl(provider: 'google' | 'github') {
    return `${process.env.API_URL}/api/auth/${provider}`;
  }
}

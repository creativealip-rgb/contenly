import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly fromEmail: string;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@camedia.id';

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not set. Email functionality will be disabled.',
      );
      return;
    }

    this.resend = new Resend(apiKey);
    this.logger.log('Email service initialized');
  }

  async sendPasswordResetEmail(
    user: { email: string; name?: string },
    url: string,
    token: string,
  ) {
    if (!this.resend) {
      this.logger.warn(
        'Email service not configured. Password reset email not sent.',
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: 'Reset Your Password - Camedia',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4f46e5;">Reset Your Password</h2>
                        <p>Hi ${user.name || 'there'},</p>
                        <p>You requested to reset your password. Click the button below to reset it:</p>
                        <div style="margin: 30px 0;">
                            <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">
                            If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #9ca3af; font-size: 12px;">
                            Camedia - AI Content Automation Platform
                        </p>
                    </div>
                `,
      });

      if (error) {
        this.logger.error('Failed to send password reset email:', error);
        throw error;
      }

      this.logger.log(`Password reset email sent to ${user.email}`);
      return data;
    } catch (error) {
      this.logger.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(
    user: { email: string; name?: string },
    url: string,
    token: string,
  ) {
    if (!this.resend) {
      this.logger.warn(
        'Email service not configured. Verification email not sent.',
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: 'Verify Your Email - Camedia',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4f46e5;">Verify Your Email</h2>
                        <p>Hi ${user.name || 'there'},</p>
                        <p>Welcome to Camedia! Please verify your email address by clicking the button below:</p>
                        <div style="margin: 30px 0;">
                            <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Verify Email
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">
                            If you didn't create an account, you can safely ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #9ca3af; font-size: 12px;">
                            Camedia - AI Content Automation Platform
                        </p>
                    </div>
                `,
      });

      if (error) {
        this.logger.error('Failed to send verification email:', error);
        throw error;
      }

      this.logger.log(`Verification email sent to ${user.email}`);
      return data;
    } catch (error) {
      this.logger.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user: { email: string; name?: string }) {
    if (!this.resend) {
      this.logger.warn('Email service not configured. Welcome email not sent.');
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: 'Welcome to Camedia!',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4f46e5;">Welcome to Camedia!</h2>
                        <p>Hi ${user.name || 'there'},</p>
                        <p>Thank you for joining Camedia. You're now ready to automate your content creation workflow.</p>
                        <div style="margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Go to Dashboard
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">
                            You have <strong>100 free tokens</strong> to start generating content!
                        </p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #9ca3af; font-size: 12px;">
                            Camedia - AI Content Automation Platform
                        </p>
                    </div>
                `,
      });

      if (error) {
        this.logger.error('Failed to send welcome email:', error);
        throw error;
      }

      this.logger.log(`Welcome email sent to ${user.email}`);
      return data;
    } catch (error) {
      this.logger.error('Error sending welcome email:', error);
      throw error;
    }
  }
}

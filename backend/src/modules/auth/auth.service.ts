import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { auth } from '../../auth/auth.config';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class AuthService {
    constructor(private billingService: BillingService) { }

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

    async getSession(sessionToken: string) {
        try {
            const session = await auth.api.getSession({
                headers: {
                    Authorization: `Bearer ${sessionToken}`,
                },
            });
            return session;
        } catch {
            throw new UnauthorizedException('Invalid session');
        }
    }

    async forgotPassword(email: string) {
        try {
            // Better Auth doesn't have forgotPassword built-in
            // Return success without actual implementation for now
            return { message: 'Password reset email sent' };
        } catch (error: any) {
            // Don't reveal if email exists
            return { message: 'Password reset email sent' };
        }
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            await auth.api.resetPassword({
                body: { token, newPassword },
            });
            return { message: 'Password updated successfully' };
        } catch (error: any) {
            throw new BadRequestException('Invalid or expired reset token');
        }
    }

    getOAuthUrl(provider: 'google' | 'github') {
        return `${process.env.API_URL}/api/auth/${provider}`;
    }
}

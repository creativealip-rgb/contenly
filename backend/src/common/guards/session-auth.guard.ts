import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';
import { DrizzleService } from '../../db/drizzle.service';
import { schema } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const DEV_BYPASS_USER_ID = 'dev-bypass-user';
export const DEV_BYPASS_USER_EMAIL = 'dev-bypass@local.test';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name);
  private devUserEnsured = false;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly drizzle: DrizzleService,
    private readonly reflector: Reflector,
  ) {}

  private isDevBypassEnabled(): boolean {
    // Never allow bypass in production
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return false;
    }
    const flag = (this.configService.get<string>('DEV_BYPASS_AUTH') || '')
      .toString()
      .trim()
      .toLowerCase();
    return flag === '1' || flag === 'true' || flag === 'yes';
  }

  private async ensureDevUser() {
    if (this.devUserEnsured) return;

    const existing = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.id, DEV_BYPASS_USER_ID),
    });

    if (!existing) {
      this.logger.warn(
        `🚧 DEV_BYPASS_AUTH active — seeding dummy user "${DEV_BYPASS_USER_ID}"`,
      );
      await this.drizzle.db.insert(schema.user).values({
        id: DEV_BYPASS_USER_ID,
        name: 'Dev Bypass User',
        email: DEV_BYPASS_USER_EMAIL,
        emailVerified: true,
      });
    }

    // Ensure token balance exists with generous dev quota so billing checks pass
    const balance = await this.drizzle.db.query.tokenBalance.findFirst({
      where: eq(schema.tokenBalance.userId, DEV_BYPASS_USER_ID),
    });
    if (!balance) {
      await this.drizzle.db.insert(schema.tokenBalance).values({
        userId: DEV_BYPASS_USER_ID,
        balance: 999999,
        totalPurchased: 999999,
      });
      this.logger.warn(
        `🚧 DEV_BYPASS_AUTH — seeded 999999 dev tokens for "${DEV_BYPASS_USER_ID}"`,
      );
    }

    this.devUserEnsured = true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (this.isDevBypassEnabled()) {
      await this.ensureDevUser();
      const devUser = await this.drizzle.db.query.user.findFirst({
        where: eq(schema.user.id, DEV_BYPASS_USER_ID),
      });
      request.user = devUser;
      return true;
    }

    // Convert Node.js headers to Web Standard Headers for Better Auth
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }

    try {
      // Let Better Auth handle token extraction (from Cookie or Header)
      const session = await this.authService.getSession({
        headers: headers,
      });

      if (!session || !session.user) {
        throw new UnauthorizedException('Unauthorized');
      }

      request.user = session.user;
      return true;
    } catch (error: any) {
      console.error('[SessionAuthGuard] Validation failed:', error);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}

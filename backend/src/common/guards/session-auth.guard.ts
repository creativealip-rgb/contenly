import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(`[SessionAuthGuard] Request: ${request.method} ${request.url}`);

    // Convert Node.js headers to Web Standard Headers for Better Auth
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }

    // Debug Headers
    const authHeader = headers.get('authorization');
    const cookieHeader = headers.get('cookie');
    const originHeader = headers.get('origin');
    const hostHeader = headers.get('host');
    console.log(`[SessionAuthGuard] Host: ${hostHeader}`);
    console.log(`[SessionAuthGuard] Origin: ${originHeader}`);
    console.log(`[SessionAuthGuard] Auth Header Present: ${!!authHeader}`);
    console.log(`[SessionAuthGuard] Cookie Header Present: ${!!cookieHeader}`);

    try {
      console.log('[SessionAuthGuard] Calling authService.getSession...');
      // Let Better Auth handle token extraction (from Cookie or Header)
      const session = await this.authService.getSession({
        headers: headers,
      });

      if (!session) {
        const cookieKeys = headers.get('cookie')
          ? headers
              .get('cookie')
              ?.split(';')
              .map((c) => c.split('=')[0].trim())
              .join(', ')
          : 'NONE';
        const authHeaderPrefix =
          headers.get('authorization')?.substring(0, 10) ?? 'NONE';

        throw new UnauthorizedException(
          `DEBUG: Session NULL. Cookies: [${cookieKeys}]. AuthHeader: [${authHeaderPrefix}]`,
        );
      }
      if (!session.user) {
        throw new UnauthorizedException('DEBUG: Session found but User NULL');
      }

      console.log(`[SessionAuthGuard] Success! User: ${session.user.email}`);
      request.user = session.user;
      return true;
    } catch (error: any) {
      console.error('[SessionAuthGuard] Validation failed:', error);
      // If it's already an HttpException, rethrow it (to keep our debug message)
      if (
        error?.response?.message &&
        error.response.message.startsWith('DEBUG:')
      ) {
        throw error;
      }
      throw new UnauthorizedException(
        `DEBUG: Validation Error. ${error.message}`,
      );
    }
  }
}

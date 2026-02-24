import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

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

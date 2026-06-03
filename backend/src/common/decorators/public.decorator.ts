import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public, bypassing SessionAuthGuard.
 *
 * NOTE: an empty method-level `@UseGuards()` does NOT remove a class-level
 * guard in NestJS — the class guard still runs. Use this decorator instead
 * for endpoints that must be reachable without a session (e.g. Stripe webhooks).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

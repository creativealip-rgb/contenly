import { Request } from 'express';

export interface RequestUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
  session?: unknown;
  apiKeyId?: string;
}

export function toWebHeaders(headers: Request['headers']) {
  const webHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      webHeaders.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => webHeaders.append(key, item));
    }
  }

  return webHeaders;
}

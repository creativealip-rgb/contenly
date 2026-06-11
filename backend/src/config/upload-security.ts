import * as path from 'path';
import { Request, Response, NextFunction } from 'express';

export const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

export function isAllowedUploadPath(filePath: string) {
  return ALLOWED_UPLOAD_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function uploadSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isAllowedUploadPath(req.path)) {
    return res.status(403).json({ message: 'File type not allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  return next();
}

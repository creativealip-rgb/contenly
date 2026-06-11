import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import { toWebHeaders } from '../common/types/authenticated-request';

export type TmpGetSession = (input: { headers: Headers }) => Promise<{ user?: unknown } | null | undefined>;

export function createTmpAuthMiddleware(
  logger: Logger,
  getSession: TmpGetSession,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await getSession({
        headers: toWebHeaders(req.headers),
      });

      if (!session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      return next();
    } catch (error) {
      logger.warn(`Tmp file auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

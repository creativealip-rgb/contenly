import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DrizzleService } from '../../db/drizzle.service';
import { renderJobs } from '../../db/schema';
import { eq, lt, and, inArray } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RenderCleanupService {
  private readonly logger = new Logger(RenderCleanupService.name);
  private readonly tmpDir = path.resolve(process.cwd(), 'tmp', 'renders');

  constructor(private drizzle: DrizzleService) {}

  /** Every 30 minutes: delete rendered files older than 1 hour */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupOldFiles() {
    if (!fs.existsSync(this.tmpDir)) return;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let cleaned = 0;

    const files = fs.readdirSync(this.tmpDir);
    for (const file of files) {
      const filePath = path.join(this.tmpDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch { /* ignore */ }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleanup: removed ${cleaned} old render files`);
    }
  }

  /** Every hour: mark stale processing jobs as timeout */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleJobs() {
    const db = this.drizzle.getDb();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stale = await db.update(renderJobs)
      .set({ status: 'timeout', error: 'Job exceeded maximum processing time', completedAt: new Date() })
      .where(and(
        eq(renderJobs.status, 'processing'),
        lt(renderJobs.startedAt, tenMinutesAgo),
      ))
      .returning({ id: renderJobs.id });

    if (stale.length > 0) {
      this.logger.warn(`Marked ${stale.length} stale render jobs as timeout`);
    }
  }

  /** Daily at 3 AM: purge completed job records older than 7 days */
  @Cron('0 3 * * *')
  async purgeOldRecords() {
    const db = this.drizzle.getDb();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deleted = await db.delete(renderJobs)
      .where(and(
        inArray(renderJobs.status, ['completed', 'failed', 'timeout']),
        lt(renderJobs.createdAt, sevenDaysAgo),
      ))
      .returning({ id: renderJobs.id });

    if (deleted.length > 0) {
      this.logger.log(`Purged ${deleted.length} old render job records`);
    }
  }
}

import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { DrizzleService } from '../../db/drizzle.service';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
    constructor(private readonly drizzleService: DrizzleService) {}

    @Get()
    async check(@Res() res: Response) {
        try {
            await this.drizzleService.db.execute(sql`SELECT 1`);

            return res.status(HttpStatus.OK).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                uptime: process.uptime(),
            });
        } catch (error) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
            });
        }
    }
}

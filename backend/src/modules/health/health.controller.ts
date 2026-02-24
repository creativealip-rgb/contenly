import { Controller, Get } from '@nestjs/common';
import { DrizzleService } from '../../db/drizzle.service';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
    constructor(private readonly drizzleService: DrizzleService) {}

    @Get()
    async check() {
        try {
            // Test database connection
            const result = await this.drizzleService.db.execute(sql`SELECT NOW()`);
            
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                uptime: process.uptime(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

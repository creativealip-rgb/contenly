import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DrizzleModule } from '../../db/drizzle.module';

@Module({
    imports: [DrizzleModule],
    controllers: [HealthController],
})
export class HealthModule {}

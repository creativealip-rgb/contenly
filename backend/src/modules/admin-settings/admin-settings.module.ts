import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../../db/drizzle.module';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  imports: [ConfigModule, AuthModule, DrizzleModule],
  controllers: [AdminSettingsController],
})
export class AdminSettingsModule {}

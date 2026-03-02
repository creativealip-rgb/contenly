import { Module } from '@nestjs/common';
import { BrandKitController } from './brand-kit.controller';
import { BrandKitService } from './brand-kit.service';
import { DrizzleModule } from '../../db/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [BrandKitController],
  providers: [BrandKitService],
  exports: [BrandKitService],
})
export class BrandKitModule {}

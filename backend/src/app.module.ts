import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Database
import { DrizzleModule } from './db/drizzle.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { AiModule } from './modules/ai/ai.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { WordpressModule } from './modules/wordpress/wordpress.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CategoryMappingModule } from './modules/category-mapping/category-mapping.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Redis Queue (BullMQ) - Optional, comment out if not using Redis
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),

    // Database (Drizzle)
    DrizzleModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ScraperModule,
    AiModule,
    ArticlesModule,
    FeedsModule,
    WordpressModule,
    BillingModule,
    NotificationsModule,
    AnalyticsModule,
    IntegrationsModule,
    CategoryMappingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

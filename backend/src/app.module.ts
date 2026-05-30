import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { Reflector } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Database
import { DrizzleModule } from './db/drizzle.module';

// Common
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AuditService } from './common/services/audit.service';

// Feature Modules
import { SecurityModule } from './modules/security/security.module';
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
import { ViewBoostModule } from './modules/view-boost/view-boost.module';
import { HealthModule } from './modules/health/health.module';
import { InstagramStudioModule } from './modules/instagram-studio/instagram-studio.module';
import { VideoScriptModule } from './modules/video-script/video-script.module';
import { TrendRadarModule } from './modules/trend-radar/trend-radar.module';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module';
import { SocialModule } from './modules/social/social.module';
import { BrandKitModule } from './modules/brand-kit/brand-kit.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { MotionGraphicsModule } from './modules/motion-graphics/motion-graphics.module';
import { VideoClipModule } from './modules/video-clip/video-clip.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Redis Queue (BullMQ)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),

    // Database (Drizzle)
    DrizzleModule,

    // Security
    SecurityModule,

    // Feature Modules
    HealthModule,
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
    ViewBoostModule,
    InstagramStudioModule,
    VideoScriptModule,
    TrendRadarModule,
    TelegramBotModule,
    SocialModule,
    BrandKitModule,
    CalendarModule,
    MotionGraphicsModule,
    VideoClipModule,
    SystemSettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuditService,
    {
      provide: Reflector,
      useValue: new Reflector(),
    },
  ],
  exports: [AuditService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}

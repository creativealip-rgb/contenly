import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AuthModule } from '../auth/auth.module';
import { OpenAiService } from './services/openai.service';
import { BillingModule } from '../billing/billing.module';
import { ArticlesModule } from '../articles/articles.module';
import { WordpressModule } from '../wordpress/wordpress.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BillingModule,
    AuthModule,
    forwardRef(() => ArticlesModule),
    forwardRef(() => WordpressModule),
    SystemSettingsModule,
    NotificationsModule,
  ],
  controllers: [AiController],
  providers: [AiService, OpenAiService],
  exports: [AiService, OpenAiService],
})
export class AiModule {}

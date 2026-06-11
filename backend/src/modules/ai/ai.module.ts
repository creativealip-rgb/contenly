import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AuthModule } from '../auth/auth.module';
import { OpenAiService } from './services/openai.service';
import { AiCostControlService } from './services/ai-cost-control.service';
import { BillingModule } from '../billing/billing.module';
import { ArticlesModule } from '../articles/articles.module';
import { WordpressModule } from '../wordpress/wordpress.module';

@Module({
  imports: [
    BillingModule,
    AuthModule,
    forwardRef(() => ArticlesModule),
    forwardRef(() => WordpressModule),
  ],
  controllers: [AiController],
  providers: [AiService, OpenAiService, AiCostControlService],
  exports: [AiService, OpenAiService, AiCostControlService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAiService } from './services/openai.service';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [BillingModule],
    controllers: [AiController],
    providers: [AiService, OpenAiService],
    exports: [AiService],
})
export class AiModule { }

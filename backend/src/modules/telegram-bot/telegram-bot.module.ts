import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';
import { ArticlesModule } from '../articles/articles.module';
import { AiModule } from '../ai/ai.module';
import { FeedsModule } from '../feeds/feeds.module';

@Module({
  imports: [ArticlesModule, AiModule, FeedsModule],
  controllers: [TelegramBotController],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}

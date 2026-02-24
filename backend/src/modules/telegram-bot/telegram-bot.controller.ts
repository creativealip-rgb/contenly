import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramBotService } from './telegram-bot.service';

@ApiTags('Telegram Bot')
@Controller('api/telegram-bot')
export class TelegramBotController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Telegram webhook' })
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string,
  ) {
    // Verify secret token
    if (secretToken !== process.env.TELEGRAM_BOT_SECRET) {
      return { ok: false, error: 'Unauthorized' };
    }

    const { message, callback_query } = update;

    // Handle callback queries (button clicks)
    if (callback_query) {
      return this.handleCallbackQuery(callback_query);
    }

    // Handle commands and messages
    if (message) {
      return this.handleMessage(message);
    }

    return { ok: true };
  }

  private async handleMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text || '';
    const telegramId = message.from.id.toString();

    // Handle /content-lab command
    if (text === '/content-lab') {
      this.telegramBotService.createSession(telegramId, message.from.id.toString());
      
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: '🚀 *Content Lab*\n\nChoose your content source:',
        parse_mode: 'Markdown',
        reply_markup: this.telegramBotService.getSourceKeyboard(),
      };
    }

    // Handle text input based on session step
    const session = this.telegramBotService.getSession(telegramId);
    if (session) {
      return this.handleSessionInput(session, telegramId, chatId, text);
    }

    // Default response
    return {
      method: 'sendMessage',
      chat_id: chatId,
      text: '👋 Welcome to Contently Bot!\n\nUse /content-lab to start creating content.',
    };
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();
    const data = callbackQuery.data;

    const [type, value] = data.split(':');
    const session = this.telegramBotService.getSession(telegramId);

    if (!session) {
      return {
        method: 'answerCallbackQuery',
        callback_query_id: callbackQuery.id,
        text: 'Session expired. Please start again with /content-lab',
      };
    }

    switch (type) {
      case 'source':
        this.telegramBotService.updateSessionData(telegramId, { source: value as any });
        this.telegramBotService.updateSession(telegramId, { step: 'tone' });
        
        let sourceText = '';
        switch (value) {
          case 'web': sourceText = '📰 Web Source (RSS)'; break;
          case 'url': sourceText = '🔗 URL'; break;
          case 'idea': sourceText = '💡 Idea'; break;
        }

        return {
          method: 'editMessageText',
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: `✅ Source: ${sourceText}\n\nNow, choose your tone:`,
          reply_markup: this.telegramBotService.getToneKeyboard(),
        };

      case 'tone':
        this.telegramBotService.updateSessionData(telegramId, { tone: value });
        this.telegramBotService.updateSession(telegramId, { step: 'category' });

        return {
          method: 'editMessageText',
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: `✅ Tone: ${value}\n\nPlease enter the category:`,
        };

      case 'action':
        return this.handleAction(session, telegramId, chatId, value, callbackQuery);

      default:
        return { method: 'answerCallbackQuery', callback_query_id: callbackQuery.id };
    }
  }

  private async handleSessionInput(session: any, telegramId: string, chatId: number, text: string) {
    switch (session.step) {
      case 'category':
        this.telegramBotService.updateSessionData(telegramId, { category: text });
        this.telegramBotService.updateSession(telegramId, { step: 'generate' });

        // If source is URL or Idea, ask for value
        if (session.data.source === 'url' || session.data.source === 'idea') {
          const prompt = session.data.source === 'url' 
            ? 'Please enter the URL:' 
            : 'Please describe your idea:';
          
          return {
            method: 'sendMessage',
            chat_id: chatId,
            text: prompt,
          };
        }

        // For web source, generate immediately
        return this.generateAndPreview(telegramId, chatId);

      case 'generate':
        this.telegramBotService.updateSessionData(telegramId, { sourceValue: text });
        return this.generateAndPreview(telegramId, chatId);

      default:
        return {
          method: 'sendMessage',
          chat_id: chatId,
          text: 'Please use the buttons or enter valid input.',
        };
    }
  }

  private async generateAndPreview(telegramId: string, chatId: number) {
    const session = this.telegramBotService.getSession(telegramId);
    if (!session) return { ok: false };

    // Send generating message
    const generatingMsg = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '⏳ Generating article... This may take a minute.',
      }),
    });

    try {
      const result = await this.telegramBotService.generateArticle(session);
      
      this.telegramBotService.updateSessionData(telegramId, {
        generatedContent: result.content,
        title: result.title,
      });
      this.telegramBotService.updateSession(telegramId, { step: 'preview' });

      // Truncate content for preview
      const preview = result.content.replace(/<[^>]*>/g, '').substring(0, 800) + '...';

      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `✅ *Article Generated!*\n\n*Title:* ${result.title}\n\n*Preview:*\n${preview}\n\nWhat would you like to do?`,
        parse_mode: 'Markdown',
        reply_markup: this.telegramBotService.getPreviewKeyboard(),
      };
    } catch (error) {
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: '❌ Error generating article. Please try again.',
      };
    }
  }

  private async handleAction(session: any, telegramId: string, chatId: number, action: string, callbackQuery: any) {
    switch (action) {
      case 'publish':
        // TODO: Implement publish to WordPress
        this.telegramBotService.clearSession(telegramId);
        return {
          method: 'editMessageText',
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: '✅ Article published to WordPress!',
        };

      case 'draft':
        // TODO: Implement save as draft
        this.telegramBotService.clearSession(telegramId);
        return {
          method: 'editMessageText',
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: '✅ Article saved as draft!',
        };

      case 'regenerate':
        return this.generateAndPreview(telegramId, chatId);

      case 'cancel':
        this.telegramBotService.clearSession(telegramId);
        return {
          method: 'editMessageText',
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          text: '❌ Cancelled. Start again with /content-lab',
        };

      default:
        return { method: 'answerCallbackQuery', callback_query_id: callbackQuery.id };
    }
  }
}

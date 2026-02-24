import { Injectable, Logger } from '@nestjs/common';
import { ArticlesService } from '../articles/articles.service';
import { AiService } from '../ai/ai.service';
import { FeedsService } from '../feeds/feeds.service';

export interface TelegramSession {
  userId: string;
  step: 'source' | 'tone' | 'category' | 'generate' | 'preview' | 'done';
  data: {
    source?: 'web' | 'url' | 'idea';
    sourceValue?: string;
    tone?: string;
    category?: string;
    generatedContent?: string;
    title?: string;
  };
}

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private sessions = new Map<string, TelegramSession>();

  constructor(
    private articlesService: ArticlesService,
    private aiService: AiService,
    private feedsService: FeedsService,
  ) { }

  getSession(telegramId: string): TelegramSession | undefined {
    return this.sessions.get(telegramId);
  }

  createSession(telegramId: string, userId: string): TelegramSession {
    const session: TelegramSession = {
      userId,
      step: 'source',
      data: {},
    };
    this.sessions.set(telegramId, session);
    return session;
  }

  updateSession(telegramId: string, update: Partial<TelegramSession>): void {
    const session = this.sessions.get(telegramId);
    if (session) {
      Object.assign(session, update);
    }
  }

  updateSessionData(telegramId: string, data: Partial<TelegramSession['data']>): void {
    const session = this.sessions.get(telegramId);
    if (session) {
      Object.assign(session.data, data);
    }
  }

  clearSession(telegramId: string): void {
    this.sessions.delete(telegramId);
  }

  async generateArticle(session: TelegramSession): Promise<{ title: string; content: string }> {
    const { source, sourceValue, tone, category } = session.data;

    let originalContent = '';
    let mode: 'rewrite' | 'idea' = 'rewrite';

    if (source === 'idea') {
      originalContent = sourceValue || '';
      mode = 'idea';
    } else if (source === 'url') {
      originalContent = sourceValue || '';
      mode = 'rewrite';
    } else {
      originalContent = sourceValue || '';
      mode = 'rewrite';
    }

    const result = await this.aiService.generateContent(session.userId, {
      originalContent,
      mode,
      options: {
        tone,
      }
    });

    return {
      title: result.title || 'Generated Article',
      content: result.content
    };
  }

  getSourceKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '📰 Web Source (RSS)', callback_data: 'source:web' },
        ],
        [
          { text: '🔗 URL', callback_data: 'source:url' },
        ],
        [
          { text: '💡 Idea', callback_data: 'source:idea' },
        ],
      ],
    };
  }

  getToneKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: 'Professional', callback_data: 'tone:professional' },
          { text: 'Casual', callback_data: 'tone:casual' },
        ],
        [
          { text: 'Friendly', callback_data: 'tone:friendly' },
          { text: 'Formal', callback_data: 'tone:formal' },
        ],
        [
          { text: 'Persuasive', callback_data: 'tone:persuasive' },
          { text: 'Informative', callback_data: 'tone:informative' },
        ],
      ],
    };
  }

  getPreviewKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '✅ Publish to WordPress', callback_data: 'action:publish' },
        ],
        [
          { text: '📝 Save as Draft', callback_data: 'action:draft' },
        ],
        [
          { text: '🔄 Regenerate', callback_data: 'action:regenerate' },
        ],
        [
          { text: '❌ Cancel', callback_data: 'action:cancel' },
        ],
      ],
    };
  }
}

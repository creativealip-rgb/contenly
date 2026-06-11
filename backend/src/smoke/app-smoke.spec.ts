import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

jest.mock('../common/guards/session-auth.guard', () => ({
  SessionAuthGuard: class SessionAuthGuard {},
}));

jest.mock('../common/guards/user-rate-limit.guard', () => ({
  SetUserRateLimit: () => () => undefined,
  UserRateLimitGuard: class UserRateLimitGuard {},
}));

jest.mock('../modules/articles/articles.service', () => ({
  ArticlesService: class ArticlesService {},
}));

jest.mock('../modules/ai/ai.service', () => ({
  AiService: class AiService {},
}));

jest.mock('../modules/billing/billing.service', () => ({
  BillingService: class BillingService {},
}));

import { ConfigService } from '@nestjs/config';
import { ArticlesController } from '../modules/articles/articles.controller';
import { ArticlesService } from '../modules/articles/articles.service';
import { AiController } from '../modules/ai/ai.controller';
import { AiService } from '../modules/ai/ai.service';
import { BillingController } from '../modules/billing/billing.controller';
import { BillingService } from '../modules/billing/billing.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { UserRateLimitGuard } from '../common/guards/user-rate-limit.guard';

const smokeUser = {
  id: 'smoke-user',
  email: 'smoke@example.com',
  role: 'user',
};

const allowSmokeUser: CanActivate = {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getRequest().user = smokeUser;
    return true;
  },
};

describe('App smoke flow with mocked AI', () => {
  let app: INestApplication;
  const articleId = 'article-smoke-1';

  const articlesServiceMock = {
    create: jest.fn().mockResolvedValue({
      id: articleId,
      title: 'Smoke Draft',
      content: 'Initial draft',
      status: 'draft',
      userId: smokeUser.id,
    }),
    update: jest.fn().mockResolvedValue({
      id: articleId,
      title: 'Smoke Draft',
      content: 'Mocked AI content',
      status: 'draft',
      userId: smokeUser.id,
    }),
    findAll: jest.fn().mockResolvedValue({
      data: [{ id: articleId, title: 'Smoke Draft', status: 'draft' }],
      total: 1,
      page: 1,
      limit: 10,
    }),
  };

  const aiServiceMock = {
    generateContent: jest.fn().mockResolvedValue({
      title: 'Smoke Draft',
      content: 'Mocked AI content',
      tokensUsed: 12,
    }),
  };

  const billingServiceMock = {
    getBalance: jest.fn().mockResolvedValue({ balance: 100 }),
    getSubscriptionTier: jest.fn().mockResolvedValue('FREE'),
    getMonthlyUsageByCategory: jest.fn().mockResolvedValue({ ARTICLE_GENERATION: 1 }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ArticlesController, AiController, BillingController],
      providers: [
        { provide: ArticlesService, useValue: articlesServiceMock },
        { provide: AiService, useValue: aiServiceMock },
        { provide: BillingService, useValue: billingServiceMock },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('') } },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(allowSmokeUser)
      .overrideGuard(UserRateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('creates article, generates mocked content, saves draft, loads billing, and lists articles', async () => {
    await request(app.getHttpServer())
      .post('/articles')
      .send({ title: 'Smoke Draft', content: 'Initial draft', status: 'draft' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe(articleId);
        expect(body.status).toBe('draft');
      });

    await request(app.getHttpServer())
      .post('/ai/generate')
      .send({ prompt: 'Rewrite this smoke draft', source: 'manual' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.content).toBe('Mocked AI content');
      });

    await request(app.getHttpServer())
      .patch(`/articles/${articleId}`)
      .send({ content: 'Mocked AI content', status: 'draft' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(articleId);
        expect(body.content).toBe('Mocked AI content');
      });

    await request(app.getHttpServer())
      .get('/billing/balance')
      .expect(200)
      .expect(({ body }) => {
        expect(body.credits).toBe(100);
        expect(body.tier).toBe('FREE');
      });

    await request(app.getHttpServer())
      .get('/articles')
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(1);
        expect(body.data[0].id).toBe(articleId);
      });

    expect(articlesServiceMock.create).toHaveBeenCalledWith(smokeUser.id, expect.any(Object));
    expect(aiServiceMock.generateContent).toHaveBeenCalledWith(smokeUser.id, expect.any(Object));
    expect(articlesServiceMock.update).toHaveBeenCalledWith(smokeUser.id, articleId, expect.any(Object));
    expect(billingServiceMock.getBalance).toHaveBeenCalledWith(smokeUser.id);
  });
});

import axios from 'axios';
import { BadRequestException } from '@nestjs/common';
import { WordpressService } from './wordpress.service';

jest.mock('axios');
jest.mock('uuid', () => ({ validate: jest.fn(() => true) }));
jest.mock('sharp', () => jest.fn());

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WordpressService credential encryption', () => {
  const encryptedPassword = 'iv:ciphertext';
  const appPassword = 'wp-app-password-123';

  let service: WordpressService;
  let db: any;
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let billingService: { getSubscriptionTier: jest.Mock };
  let articlesService: { create: jest.Mock; update: jest.Mock };

  beforeEach(() => {
    db = {
      query: {
        wpSite: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
    };

    encryptionService = {
      encrypt: jest.fn().mockReturnValue(encryptedPassword),
      decrypt: jest.fn().mockReturnValue(appPassword),
    };

    billingService = {
      getSubscriptionTier: jest.fn().mockResolvedValue('PRO'),
    };

    articlesService = {
      create: jest.fn().mockResolvedValue({ id: 'article-new' }),
      update: jest.fn().mockResolvedValue({ id: 'article-existing' }),
    };

    service = new WordpressService(
      { db } as any,
      {} as any,
      articlesService as any,
      billingService as any,
      encryptionService as any,
    );

    jest.spyOn(service, 'syncCategories').mockResolvedValue([] as any);
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
  });

  it('encrypts app password before storing site', async () => {
    const savedSite = { id: 'site-1', appPasswordEncrypted: encryptedPassword };
    db.returning.mockResolvedValue([savedSite]);
    mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

    const site = await service.connectSite('user-1', {
      name: 'My WP',
      url: 'https://example.com/',
      username: 'editor',
      appPassword,
    });

    expect(encryptionService.encrypt).toHaveBeenCalledWith(appPassword);
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        name: 'My WP',
        url: 'https://example.com',
        username: 'editor',
        appPasswordEncrypted: encryptedPassword,
        status: 'CONNECTED',
      }),
    );
    expect(db.values).not.toHaveBeenCalledWith(
      expect.objectContaining({ appPassword }),
    );
    expect(site).toBe(savedSite);
  });

  it('does not store credentials when WordPress connection fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('unauthorized'));

    await expect(
      service.connectSite('user-1', {
        name: 'Bad WP',
        url: 'https://bad.example.com',
        username: 'editor',
        appPassword,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(encryptionService.encrypt).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('decrypts stored app password before verifying site connection', async () => {
    db.query.wpSite.findFirst.mockResolvedValue({
      id: 'site-1',
      userId: 'user-1',
      name: 'My WP',
      url: 'https://example.com',
      username: 'editor',
      appPasswordEncrypted: encryptedPassword,
    });
    mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

    const result = await service.verifySiteConnection('user-1', 'site-1');

    expect(encryptionService.decrypt).toHaveBeenCalledWith(encryptedPassword);
    const expectedAuth = Buffer.from(`editor:${appPassword}`).toString(
      'base64',
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/users/me',
      expect.objectContaining({
        headers: { Authorization: `Basic ${expectedAuth}` },
      }),
    );
    expect(result).toEqual({ connected: true });
  });

  it('decrypts stored app password before creating WordPress post', async () => {
    db.query.wpSite.findFirst.mockResolvedValue({
      id: 'site-1',
      url: 'https://example.com',
      username: 'editor',
      appPasswordEncrypted: encryptedPassword,
    });
    mockedAxios.post.mockResolvedValue({
      data: { id: 321, link: 'https://example.com/post' },
    });

    const result = await service.publishPost('site-1', {
      title: 'Post title',
      content: '<p>Hello</p>',
      status: 'draft',
      categoryIds: [1, 2],
    });

    expect(encryptionService.decrypt).toHaveBeenCalledWith(encryptedPassword);
    const expectedAuth = Buffer.from(`editor:${appPassword}`).toString(
      'base64',
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts',
      expect.objectContaining({ title: 'Post title', content: '<p>Hello</p>' }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${expectedAuth}`,
        }),
      }),
    );
    expect(result).toEqual({
      wpPostId: '321',
      wpPostUrl: 'https://example.com/post',
    });
  });

  it('publishes a new article to WordPress and creates a local PUBLISHED article', async () => {
    db.query.wpSite.findFirst.mockResolvedValue({
      id: 'site-1',
      userId: 'user-1',
      url: 'https://example.com',
      username: 'editor',
      appPasswordEncrypted: encryptedPassword,
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        id: 456,
        link: 'https://example.com/published-post',
        slug: 'published-post',
        status: 'publish',
        title: { rendered: 'Published title' },
        date: '2026-06-11T00:00:00',
      },
    });

    const result = await service.publishArticle('user-1', {
      title: 'Published title',
      content: '<p>Body</p>',
      status: 'publish',
      categories: [3, 4],
      sourceUrl: 'https://source.example.com',
      originalContent: 'Original body',
      feedItemId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const expectedAuth = Buffer.from(`editor:${appPassword}`).toString(
      'base64',
    );
    expect(encryptionService.decrypt).toHaveBeenCalledWith(encryptedPassword);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts',
      expect.objectContaining({
        title: 'Published title',
        content: '<p>Body</p>',
        status: 'publish',
        categories: [3, 4],
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${expectedAuth}`,
        }),
      }),
    );
    expect(articlesService.create).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: 'Published title',
        generatedContent: '<p>Body</p>',
        originalContent: 'Original body',
        sourceUrl: 'https://source.example.com',
        status: 'PUBLISHED',
        wpPostId: '456',
        wpPostUrl: 'https://example.com/published-post',
        wpSiteId: 'site-1',
        slug: 'published-post',
        feedItemId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    );
    expect(articlesService.update).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ success: true }));
    expect(result.post).toEqual(
      expect.objectContaining({ id: 456, status: 'publish' }),
    );
  });

  it('retries transient category sync failures', async () => {
    (service.syncCategories as jest.Mock).mockRestore?.();
    db.query.wpSite.findFirst.mockResolvedValue({
      id: 'site-1',
      userId: 'user-1',
      url: 'https://example.com',
      username: 'editor',
      appPasswordEncrypted: encryptedPassword,
    });
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'News', slug: 'news' }] });

    const categories = await service.syncCategories('user-1', 'site-1');

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(categories).toEqual([{ id: 1, name: 'News', slug: 'news' }]);
  });

  it('returns friendly auth error and marks site unhealthy when publish fails', async () => {
    db.query.wpSite.findFirst.mockResolvedValue({
      id: 'site-1',
      userId: 'user-1',
      url: 'https://example.com',
      username: 'editor',
      appPasswordEncrypted: encryptedPassword,
    });
    mockedAxios.post.mockRejectedValue({
      response: { status: 401, data: { message: 'rest_cannot_create' } },
    });

    await expect(
      service.publishArticle('user-1', {
        title: 'Bad auth',
        content: '<p>Body</p>',
        status: 'publish',
      }),
    ).rejects.toThrow('WordPress authentication failed');

    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ERROR' }),
    );
  });

  it('returns sync warning when remote publish succeeds but local article update fails', async () => {
    db.query.wpSite.findFirst.mockResolvedValue({
      id: 'site-1',
      userId: 'user-1',
      url: 'https://example.com',
      username: 'editor',
      appPasswordEncrypted: encryptedPassword,
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        id: 654,
        link: 'https://example.com/remote-only',
        slug: 'remote-only',
        status: 'publish',
        title: { rendered: 'Remote only' },
        date: '2026-06-11T00:00:00',
      },
    });
    articlesService.create.mockRejectedValueOnce(
      new Error('database unavailable'),
    );

    const result = await service.publishArticle('user-1', {
      title: 'Remote only',
      content: '<p>Body</p>',
      status: 'publish',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        syncWarning: expect.stringContaining('local article sync failed'),
      }),
    );
    expect(result.post).toEqual(expect.objectContaining({ id: 654 }));
  });

  it('publishes an existing article and updates local record as SCHEDULED', async () => {
    db.query.wpSite.findFirst.mockResolvedValue({
      id: 'site-1',
      userId: 'user-1',
      url: 'https://example.com',
      username: 'editor',
      appPasswordEncrypted: encryptedPassword,
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        id: 789,
        link: 'https://example.com/future-post',
        slug: 'future-post',
        status: 'future',
        title: { rendered: 'Future title' },
        date: '2026-07-01T10:00:00',
      },
    });

    jest.spyOn(service, 'uploadMediaFromUrl').mockResolvedValue(999);

    await service.publishArticle('user-1', {
      articleId: 'article-1',
      title: 'Future title',
      content: '<p>Scheduled</p>',
      status: 'future',
      date: '2026-07-01T10:00:00',
      featuredImageUrl: 'https://cdn.example.com/image.png',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts',
      expect.objectContaining({
        title: 'Future title',
        content: '<p>Scheduled</p>',
        status: 'future',
        date: '2026-07-01T10:00:00',
      }),
      expect.any(Object),
    );
    expect(articlesService.update).toHaveBeenCalledWith(
      'user-1',
      'article-1',
      expect.objectContaining({
        title: 'Future title',
        generatedContent: '<p>Scheduled</p>',
        status: 'SCHEDULED',
        wpPostId: '789',
        wpPostUrl: 'https://example.com/future-post',
        wpSiteId: 'site-1',
        slug: 'future-post',
        featuredImageUrl: 'https://cdn.example.com/image.png',
      }),
    );
    expect(articlesService.create).not.toHaveBeenCalled();
  });
});

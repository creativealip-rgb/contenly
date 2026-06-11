import { expect, test, type Page } from '@playwright/test'

const smokeUser = {
  id: 'smoke-user',
  email: 'smoke@example.com',
  name: 'Smoke User',
  role: 'user',
  image: null,
}

const article = {
  id: 'article-smoke-1',
  title: 'Smoke Draft',
  content: 'Mocked AI content',
  status: 'DRAFT',
  createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
}

async function json(page: Page, pattern: string | RegExp, body: unknown, status = 200) {
  await page.route(pattern, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

async function mockBackend(page: Page) {
  await page.route(/\/api\/v1\/auth\/.*/, async (route) => {
    const url = route.request().url()
    const body = url.includes('list-accounts')
      ? []
      : {
          user: smokeUser,
          session: { id: 'smoke-session', token: 'smoke-token', userId: smokeUser.id },
        }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })

  await json(page, /\/api\/v1\/analytics\/dashboard.*/, {
    totalArticles: 1,
    publishedArticles: 0,
    activeFeeds: 0,
    connectedSites: 0,
    tokenBalance: 100,
    currentTier: 'FREE',
    recentActivity: [],
  })

  await json(page, /\/api\/v1\/trend-radar\/search.*/, {
    success: true,
    results: [{ title: 'Smoke trend', source: 'Mock' }],
  })

  await page.route(/\/api\/v1\/articles(\?.*)?$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...article, content: 'Initial draft' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [article], total: 1, page: 1, limit: 10 }),
    })
  })

  await json(page, /\/api\/v1\/articles\/stats\/summary.*/, {
    totalArticles: 1,
    counts: { DRAFT: 1, PUBLISHED: 0, SCHEDULED: 0, GENERATING: 0 },
    totalTokens: 12,
  })

  await page.route(/\/api\/v1\/articles\/article-smoke-1$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(article),
    })
  })

  await json(page, /\/api\/v1\/ai\/generate.*/, {
    success: true,
    data: { title: 'Smoke Draft', content: 'Mocked AI content', tokensUsed: 12 },
  }, 201)

  await json(page, /\/api\/v1\/billing\/balance.*/, {
    balance: 100,
    credits: 100,
    tier: 'FREE',
    categories: {
      artikel: { used: 1, limit: 10, label: 'Artikel' },
      instagram: { used: 0, limit: 5, label: 'IG Carousel' },
      videoLight: { used: 0, limit: 5, label: 'Video Light' },
      gambar: { used: 0, limit: 5, label: 'Gambar' },
      videoHeavy: { used: 0, limit: 1, label: 'Video Heavy' },
      motion: { used: 0, limit: 1, label: 'Motion Render' },
    },
  })

  await json(page, /\/api\/v1\/billing\/subscriptions.*/, {
    tier: 'FREE',
    status: 'active',
  })

  await json(page, /\/api\/v1\/billing\/transactions.*/, { data: [] })
  await json(page, /\/api\/v1\/notifications.*/, [])
  await json(page, /\/api\/v1\/integrations\/sites.*/, [])
}

test.describe('browser smoke with mocked backend', () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'smoke-token',
        url: baseURL,
      },
    ])
    await mockBackend(page)
  })

  test('loads dashboard, runs mocked create/generate/save flow, and opens billing/settings', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Selamat datang kembali!')).toBeVisible()
    await expect(page.getByText('Plan: FREE')).toBeVisible()

    const apiFlow = await page.evaluate(async () => {
      const created = await fetch('/api/v1/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Smoke Draft', content: 'Initial draft', status: 'draft' }),
      }).then((res) => res.json())

      const generated = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Rewrite this smoke draft', source: 'manual' }),
      }).then((res) => res.json())

      const saved = await fetch(`/api/v1/articles/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generated.data.content, status: 'draft' }),
      }).then((res) => res.json())

      return { created, generated, saved }
    })

    expect(apiFlow.created.id).toBe('article-smoke-1')
    expect(apiFlow.generated.data.content).toBe('Mocked AI content')
    expect(apiFlow.saved.status).toBe('DRAFT')

    await page.goto('/articles')
    await expect(page.getByText('Smoke Draft')).toBeVisible()

    await page.goto('/billing')
    await expect(page.getByText('100', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Artikel', { exact: true }).first()).toBeVisible()

    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings$/)
  })
})

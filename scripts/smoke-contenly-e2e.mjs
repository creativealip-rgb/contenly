#!/usr/bin/env node

import fs from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const args = new Set(process.argv.slice(2))
const API_BASE = process.env.CONTENLY_API_BASE || 'https://contenly.app/api/v1'
const WP_BASE = process.env.CONTENLY_WP_BASE || 'https://nggawe.web.id'
const COOKIE_JAR = process.env.CONTENLY_COOKIE_JAR || '/tmp/c.txt'
const PUBLISH = args.has('--publish') || process.env.CONTENLY_SMOKE_PUBLISH === '1'
const GENERATE_IMAGE = args.has('--image') || process.env.CONTENLY_SMOKE_IMAGE === '1'
const FEED_URL = process.env.CONTENLY_SMOKE_FEED_URL || ''
const CATEGORY_ID = Number(process.env.CONTENLY_SMOKE_CATEGORY_ID || 33)
const TIMEOUT_MS = Number(process.env.CONTENLY_SMOKE_TIMEOUT_MS || 120000)

const results = []

function log(step, data = {}) {
  results.push({ step, ok: true, ...data })
  console.log(`✅ ${step}${data.message ? ` — ${data.message}` : ''}`)
}

function fail(step, message, data = {}) {
  const err = new Error(message)
  err.step = step
  err.data = data
  throw err
}

function cookieHeader() {
  if (!fs.existsSync(COOKIE_JAR)) {
    fail('cookie', `Cookie jar not found: ${COOKIE_JAR}`)
  }
  const raw = fs.readFileSync(COOKIE_JAR, 'utf8')
  const cookies = []
  for (let line of raw.split('\n')) {
    if (!line) continue
    if (line.startsWith('#HttpOnly_')) line = line.replace('#HttpOnly_', '')
    if (line.startsWith('#')) continue
    const parts = line.split('\t')
    if (parts.length >= 7) cookies.push(`${parts[5]}=${parts[6]}`)
  }
  if (!cookies.length) fail('cookie', `No cookies found in ${COOKIE_JAR}`)
  return cookies.join('; ')
}

async function request(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || TIMEOUT_MS)
  try {
    const headers = {
      ...(options.json ? { 'Content-Type': 'application/json' } : {}),
      ...(options.auth === false ? {} : { Cookie: cookieHeader() }),
      ...(options.headers || {}),
    }
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.json ? JSON.stringify(options.json) : options.body,
      redirect: options.redirect || 'follow',
      signal: controller.signal,
    })
    const text = await res.text()
    let data = text
    try { data = text ? JSON.parse(text) : null } catch {}
    if (!res.ok && options.allowBad !== true) {
      fail(options.step || url, `HTTP ${res.status}`, { data })
    }
    return { res, data, text }
  } finally {
    clearTimeout(timer)
  }
}

function pickItems(payload) {
  return payload?.items || payload?.data || []
}

function textContains(html, needle) {
  return String(html || '').toLowerCase().includes(String(needle || '').toLowerCase())
}

async function main() {
  console.log('Contenly smoke start')
  console.log(`API_BASE=${API_BASE}`)
  console.log(`WP_BASE=${WP_BASE}`)
  console.log(`PUBLISH=${PUBLISH}`)
  console.log(`GENERATE_IMAGE=${GENERATE_IMAGE}`)

  const health = await request(`${API_BASE.replace(/\/api\/v1$/, '')}/health`, { auth: false, step: 'health' })
  log('health', { message: JSON.stringify(health.data) })

  const feedsResp = await request(`${API_BASE}/feeds`, { step: 'feeds list' })
  const feeds = Array.isArray(feedsResp.data) ? feedsResp.data : feedsResp.data?.data || []
  if (!feeds.length && !FEED_URL) fail('feeds list', 'No feeds found and CONTENLY_SMOKE_FEED_URL empty')
  const feedUrl = FEED_URL || feeds[0].url
  log('feeds list', { message: `${feeds.length} feeds; using ${feedUrl}` })

  const feedItemsResp = await request(`${API_BASE}/feeds/fetch-items`, {
    method: 'POST',
    json: { url: feedUrl },
    step: 'fetch RSS items',
  })
  const items = pickItems(feedItemsResp.data)
  if (!items.length) fail('fetch RSS items', 'No RSS items returned', { data: feedItemsResp.data })
  const item = items[0]
  const sourceUrl = item.link || item.url
  if (!sourceUrl) fail('pick RSS item', 'RSS item missing link/url', { item })
  log('fetch RSS items', { message: `${items.length} items; picked ${item.title}` })

  const scrapeResp = await request(`${API_BASE}/scraper/scrape`, {
    method: 'POST',
    json: { url: sourceUrl },
    step: 'scrape source',
  })
  if (!scrapeResp.data?.success) fail('scrape source', 'Scrape failed', { data: scrapeResp.data })
  const scraped = scrapeResp.data.data || {}
  const sourceContent = scraped.content || scraped.excerpt || ''
  if (sourceContent.length < 100) fail('scrape source', 'Scraped content too short', { length: sourceContent.length })
  log('scrape source', { message: `${scraped.title || item.title}; ${sourceContent.length} chars` })

  const genResp = await request(`${API_BASE}/ai/generate`, {
    method: 'POST',
    timeoutMs: TIMEOUT_MS,
    json: {
      originalContent: sourceContent,
      title: scraped.title || item.title || 'RSS Smoke Test Article',
      sourceUrl,
      mode: 'rewrite',
      categoryId: CATEGORY_ID,
      options: { tone: 'professional', length: 'short' },
    },
    step: 'AI generate',
  })
  if (!genResp.data?.success || !genResp.data?.data?.content) fail('AI generate', 'Generate failed', { data: genResp.data })
  const generated = genResp.data.data
  log('AI generate', { message: `${generated.title}; ${generated.content.length} chars` })

  let imageUrl = undefined
  if (GENERATE_IMAGE) {
    const imageResp = await request(`${API_BASE}/ai/generate-image`, {
      method: 'POST',
      timeoutMs: TIMEOUT_MS,
      json: { prompt: `Professional featured image for blog post: ${generated.title}. No text.` },
      step: 'AI image',
    })
    imageUrl = imageResp.data?.data?.imageUrl || imageResp.data?.imageUrl
    if (!imageUrl) fail('AI image', 'Image URL missing', { data: imageResp.data })
    const assetResp = await request(imageUrl.startsWith('http') ? imageUrl : `${API_BASE.replace(/\/api\/v1$/, '')}${imageUrl}`, {
      auth: false,
      step: 'AI image asset',
    })
    if (assetResp.res.headers.get('content-type')?.includes('image') !== true) {
      fail('AI image asset', 'Asset is not image', { contentType: assetResp.res.headers.get('content-type') })
    }
    log('AI image', { message: imageUrl })
  }

  const articleCreate = await request(`${API_BASE}/articles`, {
    method: 'POST',
    json: {
      title: generated.title,
      generatedContent: generated.content,
      originalContent: sourceContent,
      sourceUrl,
      metaTitle: generated.title,
      metaDescription: generated.metaDescription || '',
      slug: generated.slug || '',
      featuredImageUrl: imageUrl,
      tokensUsed: generated.tokensUsed || 0,
      status: 'DRAFT',
    },
    step: 'create draft',
  })
  const article = articleCreate.data
  if (!article?.id) fail('create draft', 'Article ID missing', { data: articleCreate.data })
  log('create draft', { message: `${article.id}` })

  if (!PUBLISH) {
    console.log('\nPublish skipped. Re-run with --publish or CONTENLY_SMOKE_PUBLISH=1 for full WP verification.')
    console.log(JSON.stringify({ ok: true, articleId: article.id, title: generated.title, published: false }, null, 2))
    return
  }

  const publishResp = await request(`${API_BASE}/wordpress/publish`, {
    method: 'POST',
    json: {
      title: generated.title,
      content: generated.content,
      status: 'publish',
      categories: [CATEGORY_ID],
      sourceUrl,
      originalContent: sourceContent,
      featuredImageUrl: imageUrl,
      articleId: article.id,
    },
    step: 'publish WordPress',
  })
  if (!publishResp.data?.success) fail('publish WordPress', 'Publish failed', { data: publishResp.data })
  const post = publishResp.data.post
  log('publish WordPress', { message: `${post.id} ${post.link}` })

  // Give WP cache a beat.
  await sleep(1000)

  const wpApi = await request(`${WP_BASE}/wp-json/wp/v2/posts/${post.id}?_fields=id,status,link,categories,title`, {
    auth: false,
    step: 'WP API verify',
  })
  const wp = wpApi.data
  if (wp.status !== 'publish') fail('WP API verify', `Unexpected status ${wp.status}`, { wp })
  if (!Array.isArray(wp.categories) || !wp.categories.includes(36) || !wp.categories.includes(CATEGORY_ID)) {
    fail('WP API verify', `Expected categories include 36 and ${CATEGORY_ID}`, { wp })
  }
  log('WP API verify', { message: `categories ${JSON.stringify(wp.categories)}` })

  const postPage = await request(post.link, { auth: false, step: 'WP post page' })
  if (!textContains(postPage.text, generated.title.slice(0, 40))) {
    fail('WP post page', 'Post page does not contain generated title', { link: post.link })
  }
  log('WP post page', { message: `HTTP ${postPage.res.status}` })

  const blogPage = await request(`${WP_BASE}/blog/`, { auth: false, step: 'WP blog page' })
  if (!textContains(blogPage.text, generated.title.slice(0, 40))) {
    fail('WP blog page', 'Blog page does not contain generated title')
  }
  log('WP blog page', { message: 'title found' })

  const verifyArticle = await request(`${API_BASE}/articles/${article.id}`, { step: 'Contenly article verify' })
  if (verifyArticle.data?.status !== 'PUBLISHED' || String(verifyArticle.data?.wpPostId) !== String(post.id)) {
    fail('Contenly article verify', 'Article status/wpPostId mismatch', { article: verifyArticle.data })
  }
  log('Contenly article verify', { message: `${verifyArticle.data.status} ${verifyArticle.data.wpPostUrl}` })

  console.log('\nSmoke OK')
  console.log(JSON.stringify({
    ok: true,
    sourceUrl,
    articleId: article.id,
    wpPostId: post.id,
    wpPostUrl: post.link,
    categories: wp.categories,
    title: generated.title,
  }, null, 2))
}

main().catch((err) => {
  console.error(`\n❌ ${err.step || 'smoke'} — ${err.message}`)
  if (err.data) console.error(JSON.stringify(err.data, null, 2))
  console.error('\nPartial results:')
  console.error(JSON.stringify(results, null, 2))
  process.exit(1)
})

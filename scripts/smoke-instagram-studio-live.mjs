#!/usr/bin/env node
import fs from 'node:fs'

const API_BASE = process.env.CONTENLY_API_BASE || 'https://contenly.app/api/v1'
const COOKIE_JAR = process.env.CONTENLY_COOKIE_JAR || '/tmp/contenly-admin-cookies.txt'
const SOURCE_URL = process.env.CONTENLY_IG_SOURCE_URL || 'https://techcrunch.com/2026/06/20/in-the-weights-is-your-new-ai-centric-vanity-search/'
const TIMEOUT_MS = Number(process.env.CONTENLY_IG_TIMEOUT_MS || 180000)
const RUN_TEXT_OVERLAY = ['1', 'true', 'yes'].includes(String(process.env.CONTENLY_IG_RUN_TEXT_OVERLAY || '').toLowerCase())
const RUN_ALL_IMAGES = ['1', 'true', 'yes'].includes(String(process.env.CONTENLY_IG_RUN_ALL_IMAGES || '').toLowerCase())
const IMAGE_CONCURRENCY = Math.max(1, Number(process.env.CONTENLY_IG_IMAGE_CONCURRENCY || 3))

async function timed(step, fn) {
  const start = Date.now()
  try {
    const result = await fn()
    console.log(`⏱️ ${step} took ${((Date.now() - start) / 1000).toFixed(1)}s`)
    return result
  } catch (error) {
    console.log(`⏱️ ${step} failed after ${((Date.now() - start) / 1000).toFixed(1)}s`)
    throw error
  }
}

function cookieHeader() {
  const raw = fs.readFileSync(COOKIE_JAR, 'utf8')
  const cookies = []
  for (let line of raw.split('\n')) {
    if (!line) continue
    if (line.startsWith('#HttpOnly_')) line = line.replace('#HttpOnly_', '')
    if (line.startsWith('#')) continue
    const parts = line.split('\t')
    if (parts.length >= 7) cookies.push(`${parts[5]}=${parts[6]}`)
  }
  if (!cookies.length) throw new Error(`No cookies in ${COOKIE_JAR}`)
  return cookies.join('; ')
}

async function req(path, opts = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || TIMEOUT_MS)
  try {
    const res = await fetch(path.startsWith('http') ? path : `${API_BASE}${path}`, {
      method: opts.method || 'GET',
      headers: {
        Cookie: cookieHeader(),
        ...(opts.json ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.headers || {}),
      },
      body: opts.json ? JSON.stringify(opts.json) : opts.body,
      signal: controller.signal,
    })
    const text = await res.text()
    let data = text
    try { data = text ? JSON.parse(text) : null } catch {}
    if (!res.ok && !opts.allowBad) throw new Error(`${opts.step || path} HTTP ${res.status}: ${text.slice(0, 500)}`)
    return { res, data, text }
  } finally {
    clearTimeout(timer)
  }
}

function ok(step, message = '') { console.log(`✅ ${step}${message ? ` — ${message}` : ''}`) }

async function main() {
  console.log('Instagram Studio live smoke start')
  console.log(`API_BASE=${API_BASE}`)
  console.log(`SOURCE_URL=${SOURCE_URL}`)

  const health = await fetch(`${API_BASE.replace(/\/api\/v1$/, '')}/health`)
  if (!health.ok) throw new Error(`health HTTP ${health.status}`)
  ok('health', await health.text())

  const templates = await req('/instagram-studio/templates')
  const templateList = Array.isArray(templates.data) ? templates.data : []
  ok('templates', `${templateList.length} templates`)

  const fetched = await req(`/instagram-studio/fetch-url?url=${encodeURIComponent(SOURCE_URL)}`)
  const title = fetched.data?.title || `IG Smoke ${Date.now()}`
  const content = fetched.data?.content || fetched.data?.excerpt || ''
  if (content.length < 100) throw new Error(`fetched content too short: ${content.length}`)
  ok('fetch url', `${title}; ${content.length} chars`)

  const projectResp = await req('/instagram-studio/projects', {
    method: 'POST',
    json: {
      title: `[SMOKE] ${title}`.slice(0, 140),
      sourceUrl: SOURCE_URL,
      sourceContent: content,
      globalStyle: 'modern minimal, clean Indonesian news carousel',
      fontFamily: 'Montserrat',
      templateId: templateList[0]?.id,
    },
    step: 'create project',
  })
  const projectId = projectResp.data?.id
  if (!projectId) throw new Error(`project id missing: ${JSON.stringify(projectResp.data).slice(0, 500)}`)
  ok('create project', projectId)

  const storyboard = await timed('generate storyboard', () => req(`/instagram-studio/projects/${projectId}/generate-storyboard`, {
    method: 'POST',
    json: { content, style: 'modern minimal, clean Indonesian news carousel' },
    step: 'generate storyboard',
  }))
  const slides = storyboard.data?.slides || []
  if (!slides.length) throw new Error(`no slides returned: ${JSON.stringify(storyboard.data).slice(0, 500)}`)
  ok('generate storyboard', `${slides.length} slides`)

  const firstSlide = slides[0]
  const imageResp = await timed('generate first image', () => req(`/instagram-studio/slides/${firstSlide.id}/generate-image`, {
    method: 'POST',
    json: { style: 'modern minimal, clean Indonesian news carousel' },
    step: 'generate first image',
    timeoutMs: TIMEOUT_MS,
  }))
  ok('generate first image', imageResp.data?.imageUrl || imageResp.data?.image_url || 'ok')

  if (RUN_ALL_IMAGES && slides.length > 1) {
    const remaining = slides.slice(1)
    let index = 0
    const worker = async () => {
      while (index < remaining.length) {
        const slide = remaining[index++]
        const resp = await req(`/instagram-studio/slides/${slide.id}/generate-image`, {
          method: 'POST',
          json: { style: 'modern minimal, clean Indonesian news carousel' },
          step: `generate image slide ${slide.slideNumber || slide.id}`,
          timeoutMs: TIMEOUT_MS,
        })
        ok(`generate image slide ${slide.slideNumber || slide.id}`, resp.data?.imageUrl || resp.data?.image_url || 'ok')
      }
    }
    await timed(`generate remaining ${remaining.length} images parallel x${Math.min(IMAGE_CONCURRENCY, remaining.length)}`, () =>
      Promise.all(Array.from({ length: Math.min(IMAGE_CONCURRENCY, remaining.length) }, worker)),
    )
  }

  if (RUN_TEXT_OVERLAY) {
    const textResp = await timed('generate text overlay', () => req(`/instagram-studio/slides/${firstSlide.id}/generate-text`, {
      method: 'POST',
      step: 'generate text overlay',
      allowBad: true,
    }))
    if (textResp.res.ok) ok('generate text overlay', 'ok')
    else ok('generate text overlay skipped/failed non-blocking', `HTTP ${textResp.res.status}`)
  } else {
    ok('generate text overlay skipped', 'text already requested inside image prompt; set CONTENLY_IG_RUN_TEXT_OVERLAY=1 to test legacy overlay')
  }

  if (slides.length > 1) {
    await req(`/instagram-studio/projects/${projectId}/slides/reorder`, {
      method: 'PATCH',
      json: { slideId: slides[0].id, newSlideNumber: 2 },
      step: 'reorder slides',
    })
    ok('reorder slides', 'slide 1 -> 2')
  }

  const exportResp = await req(`/instagram-studio/projects/${projectId}/export`, {
    method: 'POST',
    json: { format: 'png' },
    step: 'export png',
    timeoutMs: TIMEOUT_MS,
  })
  const exports = Array.isArray(exportResp.data) ? exportResp.data : []
  if (!exports.length) throw new Error(`export empty: ${JSON.stringify(exportResp.data).slice(0, 500)}`)
  ok('export png', `${exports.length} files`)

  const zipResp = await req(`/instagram-studio/projects/${projectId}/export/zip`, {
    method: 'POST',
    json: { format: 'png' },
    step: 'export zip',
    timeoutMs: TIMEOUT_MS,
  })
  const ctype = zipResp.res.headers.get('content-type') || ''
  if (!ctype.includes('zip')) throw new Error(`zip content-type unexpected: ${ctype}`)
  ok('export zip', `${zipResp.text.length} chars response body`)

  const list = await req('/instagram-studio/projects')
  const found = Array.isArray(list.data) && list.data.some((p) => p.id === projectId)
  if (!found) throw new Error('project not found in list after create')
  ok('project list verify', 'found')

  console.log('\nSmoke OK')
  console.log(JSON.stringify({ ok: true, projectId, title: projectResp.data?.title, slides: slides.length }, null, 2))
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`)
  process.exit(1)
})

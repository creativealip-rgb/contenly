#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const API_BASE = process.env.CONTENLY_API_BASE || 'https://contenly.app/api/v1'
const COOKIE_JAR = process.env.CONTENLY_COOKIE_JAR || '/tmp/c.txt'
const PROJECT_ID = process.env.CONTENLY_VIDEO_SCRIPT_PROJECT_ID || process.argv[2]
const MIN_BYTES = Number(process.env.CONTENLY_VIDEO_SCRIPT_MIN_BYTES || 100000)
const OUT = process.env.CONTENLY_VIDEO_SCRIPT_OUT || `/tmp/video-script-export-${Date.now()}.mp4`
const TIMEOUT_MS = Number(process.env.CONTENLY_SMOKE_TIMEOUT_MS || 180000)

function fail(step, message, data = {}) {
  console.error(`❌ ${step} — ${message}`)
  if (Object.keys(data).length) console.error(JSON.stringify(data, null, 2))
  process.exit(1)
}

function cookieHeader() {
  if (!fs.existsSync(COOKIE_JAR)) fail('cookie', `Cookie jar not found: ${COOKIE_JAR}`)
  const cookies = []
  for (let line of fs.readFileSync(COOKIE_JAR, 'utf8').split('\n')) {
    if (!line) continue
    if (line.startsWith('#HttpOnly_')) line = line.replace('#HttpOnly_', '')
    if (line.startsWith('#')) continue
    const parts = line.split('\t')
    if (parts.length >= 7) cookies.push(`${parts[5]}=${parts[6]}`)
  }
  if (!cookies.length) fail('cookie', `No cookies found in ${COOKIE_JAR}`)
  return cookies.join('; ')
}

if (!PROJECT_ID) fail('config', 'Set CONTENLY_VIDEO_SCRIPT_PROJECT_ID or pass project id arg')

const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
try {
  const res = await fetch(`${API_BASE}/video-scripts/projects/${PROJECT_ID}/export/video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
    body: JSON.stringify({ voice: process.env.CONTENLY_VIDEO_SCRIPT_VOICE || 'nova' }),
    signal: controller.signal,
  })
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) fail('export-video', `HTTP ${res.status}`, { body: await res.text() })
  if (!contentType.includes('video/mp4')) fail('content-type', `Expected video/mp4, got ${contentType}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  if (bytes.length < MIN_BYTES) fail('size', `Expected >= ${MIN_BYTES} bytes, got ${bytes.length}`)
  fs.writeFileSync(OUT, bytes)
  console.log(`✅ export-video — ${bytes.length} bytes saved to ${OUT}`)

  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-show_streams', '-of', 'json', OUT], { encoding: 'utf8' })
  if (probe.status !== 0) fail('ffprobe', probe.stderr || 'ffprobe failed')
  const meta = JSON.parse(probe.stdout)
  const hasVideo = meta.streams?.some((s) => s.codec_type === 'video' && s.codec_name === 'h264')
  const hasAudio = meta.streams?.some((s) => s.codec_type === 'audio')
  if (!hasVideo) fail('ffprobe-video', 'No H.264 video stream', meta)
  if (!hasAudio) fail('ffprobe-audio', 'No audio stream', meta)
  console.log(`✅ ffprobe — duration=${meta.format?.duration}s size=${meta.format?.size}`)
  console.log(JSON.stringify({ ok: true, projectId: PROJECT_ID, out: OUT, bytes: bytes.length, duration: meta.format?.duration }, null, 2))
} finally {
  clearTimeout(timer)
}

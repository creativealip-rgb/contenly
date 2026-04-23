# Video Script Creator Implementation Plan

## Goal
Menerapkan fitur utama dari referensi `docs/aiscriptvideo.jsx` ke modul Contenly `/video-scripts` dengan pendekatan yang cocok untuk arsitektur saat ini: Next.js frontend + NestJS backend + Drizzle/Postgres.

## Current State Summary
Saat ini modul `video-script` sudah punya:

- daftar project
- detail project
- generate script dasar dari source content
- scene list sederhana
- export script dasar (`json`, `srt`, `txt`, `caption`)
- export full voiceover MP3 via OpenAI TTS

Gap terbesar dibanding referensi Gemini:

- belum ada metadata script kaya (`headline`, `sub_headline`, `caption`, `hook`, `thumbnail_prompt`, `music_suggestion`, `hashtags`)
- belum ada `footage_searches` per scene
- belum ada regenerate granular per field / per scene
- belum ada editor scene yang persisten penuh
- belum ada preview/generate audio per scene
- belum ada history/revision workflow
- belum ada thumbnail generation dari prompt
- belum ada pilihan durasi yang benar-benar mempengaruhi output secara presisi

## Scope yang Akan Dibawa
### Phase 1: Data Model & API Foundation
- Tambah metadata di `script_project`:
  - `headline`
  - `subHeadline`
  - `caption`
  - `hook`
  - `thumbnailPrompt`
  - `musicSuggestion`
  - `hashtags` (json/text array)
- Tambah metadata di `script_scene`:
  - `footageSearches` (json)
- Tambah migration Drizzle.
- Perluas DTO dan response typing backend/frontend.

### Phase 2: AI Output Upgrade
- Rework `VideoScriptService.buildSystemPrompt()` agar output JSON setara kebutuhan referensi.
- Output target:
  - metadata project lengkap
  - scene dengan `visual_context`, `voiceover_text`, `estimated_duration`, `emoji`, `footage_searches`
- Durasi dibuat lebih ketat berbasis target words, bukan hanya guidance umum.
- Simpan hasil AI langsung ke schema baru.

### Phase 3: Editor UX Upgrade
- Redesign page `frontend/src/app/(dashboard)/video-scripts/[id]/page.tsx`.
- Tambah area:
  - source article editor
  - duration selector
  - metadata cards
  - scene cards dual-column
  - copy full script / copy caption
  - export clean TXT / JSON / caption / SRT
- Scene VO dan visual dibuat editable dan persist ke backend.

### Phase 4: Regenerate Granular
- Endpoint baru:
  - regenerate `headline`
  - regenerate `subHeadline`
  - regenerate `caption`
  - regenerate `thumbnailPrompt`
  - regenerate scene voiceover
  - optional: regenerate scene visual
- Regenerate harus update DB, bukan hanya state lokal.

### Phase 5: Audio Features
- Tambah preview TTS per scene dari backend.
- Tambah download audio per scene.
- Pertahankan export full project voiceover, tapi ubah agar konsisten dengan suara yang dipilih user.
- Tambah voice selector di UI.

### Phase 6: Thumbnail Features
- Generate thumbnail dari `thumbnailPrompt` memakai service image yang sudah ada (`OpenAiService.generateImage`) atau endpoint baru khusus thumbnail.
- User bisa edit prompt lalu regenerate image.

### Phase 7: Revision History
- Simpan history di database, bukan localStorage, supaya konsisten lintas device.
- Opsi minimal:
  - `script_project_revision` table
  - snapshot metadata + scenes saat generate/regenerate besar
- Jika ingin shipping cepat, history bisa dipisah jadi fase setelah MVP parity.

## Proposed API Changes
- `PATCH /video-scripts/projects/:id/generate-script`
  - response lengkap dengan metadata baru
- `PATCH /video-scripts/projects/:id`
  - update metadata umum project
- `PATCH /video-scripts/scenes/:id`
  - update visual, VO, footage
- `POST /video-scripts/projects/:id/regenerate`
  - granular field regenerate
- `POST /video-scripts/scenes/:id/regenerate-voiceover`
- `POST /video-scripts/projects/:id/thumbnail`
- `POST /video-scripts/scenes/:id/tts`

## File Areas Likely To Change
- `backend/src/db/schema.ts`
- `backend/drizzle/...` migration baru
- `backend/src/modules/video-script/video-script.dto.ts`
- `backend/src/modules/video-script/video-script.controller.ts`
- `backend/src/modules/video-script/video-script.service.ts`
- `backend/src/modules/ai/services/openai.service.ts`
- `frontend/src/app/(dashboard)/video-scripts/page.tsx`
- `frontend/src/app/(dashboard)/video-scripts/[id]/page.tsx`

## Delivery Strategy
1. Schema + backend contract dulu.
2. Upgrade AI generation output.
3. Rebuild editor UI.
4. Tambah granular regenerate.
5. Tambah per-scene TTS dan thumbnail.
6. Tambah revision history bila core flow sudah stabil.

## Risks / Decisions To Confirm
- History mau full database-backed sekarang atau ditunda setelah parity dasar?
- Thumbnail generation cukup 1 image per project, atau perlu gallery/multi-variant?
- TTS per scene akan consume token terpisah atau dibundel ke export audio?
- `footage_searches` cukup berupa platform + keyword + URL hasil search, atau perlu scraping footage preview juga?

## Recommended First Implementation Slice
Mulai dari Phase 1-4 dulu. Itu sudah memberi parity fitur inti paling terasa: hasil script lebih kaya, editor lebih usable, metadata lengkap, dan regenerate granular. Audio preview, thumbnail image generation, dan history database bisa masuk batch berikutnya setelah core flow stabil.

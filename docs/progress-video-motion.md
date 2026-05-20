# Progress: Video Script & Motion Graphics

## ✅ P0 — Done
1. ~~Frontend select-footage: ubah POST → PATCH~~ ✅
2. ~~Register 6 template di remotion/src/Root.tsx~~ ✅ (18 templates terdaftar)
3. ~~getTemplate: ubah @Query('id') → @Param('id')~~ ✅
4. ~~Tambah deductTokens di 5 endpoint video-script + semua endpoint motion-graphics render~~ ✅
5. ~~@Throttle ke render endpoints~~ ⚠️ Pakai custom @SetUserRateLimit (render: 3/min, compose: 2/min). Sudah fungsional.

## ✅ P1 — Done
6. ~~Fix compose video silent (pre-render TTS, attach ke ComposedVideo)~~ ✅
7. ~~Server-side file size limit untuk transcription upload~~ ✅ (25MB)
8. ~~Confirmation dialog "Generate Ulang" sebelum destroy scenes~~ ✅
9. ~~Cleanup /dev/video-scripts/ (stale duplicate)~~ ✅ (deleted)
10. ~~Persist thumbnail URL ke DB~~ ✅

## ✅ P2 — Done
11. ~~Bull queue untuk rendering (async, polling, progress)~~ ✅
    - BullModule.forRoot() di-uncomment di app.module.ts
    - Queue 'render' registered di MotionGraphicsModule
    - RenderProcessor handles template/caption/compose jobs (concurrency: 2)
    - Frontend polling setiap 3 detik sampai job selesai
    - Endpoints: POST returns `{ jobId }`, GET /jobs/:id untuk polling, GET /jobs/:id/download untuk download
12. ~~Render timeout + scheduled cleanup tmp files~~ ✅
    - Timeout 5 menit (template/caption), 10 menit (compose) via Bull job timeout
    - RenderCleanupService: cron setiap 30 menit hapus file > 1 jam
    - Cron setiap jam mark stale processing jobs sebagai timeout
    - Cron harian purge records > 7 hari
13. ~~JSON/array editor untuk props (BulletList items, AutoCaption words)~~ ✅
    - Komponen `JsonArrayEditor` di `frontend/src/components/ui/json-array-editor.tsx`
    - Mode `array-strings`: inline editor untuk string arrays (BulletList items)
    - Mode `json`: raw JSON textarea dengan validasi (AutoCaption words)
14. ~~Health-check endpoint untuk Remotion bundle~~ ✅ (sudah ada sebelumnya)
15. ~~DB table untuk render jobs (audit + analytics)~~ ✅
    - Table `render_jobs` dengan status enum (queued/processing/completed/failed/timeout)
    - Tracks: userId, type, input, outputPath, outputFormat, error, progress, tokensCost, timestamps
    - Migration: `backend/drizzle/0005_render_jobs.sql`
    - ScheduleModule.forRoot() di-enable untuk cron cleanup

## Catatan
- Item #5: Menggunakan custom `@SetUserRateLimit` decorator, bukan `@Throttle` dari `@nestjs/throttler`. Fungsionalitas sama.
- Item #4: `aiGenerateAnimation` endpoint tidak pakai deductTokens (bukan render endpoint, hanya AI suggestion).
- Redis diperlukan untuk Bull queue. Pastikan REDIS_HOST, REDIS_PORT, REDIS_PASSWORD di .env.
- Render endpoints sekarang async: POST → { jobId }, lalu poll GET /jobs/:id sampai completed, lalu download via GET /jobs/:id/download.

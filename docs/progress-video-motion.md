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

## ❌ P2 — Belum Dikerjakan
11. Bull queue untuk rendering (async, polling, progress via Socket.io)
12. Render timeout + scheduled cleanup tmp files
13. JSON/array editor untuk props (BulletList items, AutoCaption words)
14. ~~Health-check endpoint untuk Remotion bundle~~ ✅ (sudah ada)
15. DB table untuk render jobs (audit + analytics)

## Catatan
- Item #5: Menggunakan custom `@SetUserRateLimit` decorator, bukan `@Throttle` dari `@nestjs/throttler`. Fungsionalitas sama, bisa di-revisit jika perlu konsistensi.
- Item #4: `aiGenerateAnimation` endpoint tidak pakai deductTokens (bukan render endpoint, hanya AI suggestion).
- P2 items 11, 12, 13, 15 saling terkait — idealnya dikerjakan bareng (Bull queue + render jobs table + timeout).

# Video Studio: Script & Clips — Feature Update

Comprehensive overhaul of the **Video Scripts** and **Video Clips** modules. This document covers everything new across UI, AI features, backend pipelines, and database schema changes.

---

## Video Scripts

### Editor: storyboard-grade UX

- **Sticky stats bar** at the top of the editor: total estimated duration vs. target with color-coded progress, scene count, total words, footage progress (`X/Y scenes have footage`), words-per-minute hint.
- **Storyboard view** toggle: horizontal grid with per-scene thumbnails (from selected footage), hook/CTA badges, click to jump-to-scene.
- **Collapsible scene cards** — long projects automatically collapse middle scenes to a one-line preview (thumbnail + voiceover snippet + visual hint). Click to expand.
- **Inline AI Improve** button per scene: rewrites `visualContext` + `brollPrompt` with one click (1 token).
- **Director's Notes** panel per scene: free-form catatan untuk editor / collaborator (e.g. SFX cues, transition notes).
- **Play All Scenes**: sequential auto-play of all scene voiceovers with a TTS audio cache so the same scene isn't re-rendered (saves tokens).
- **TTS audio cache** (in-memory): single-scene preview reuses generated audio until voiceover text or selected voice changes.
- **Empty state actions**: "Generate dari Source", "Mulai Manual" buttons.
- **Improved generate dialog**:
  - Source content textarea inside the dialog (no more navigating to editor first).
  - Style controls with chip-based selection:
    - **Tone**: Casual / Professional / Edgy / Educational / Comedy
    - **Hook style**: Question / Statistic / Bold Claim / Story
    - **Pacing**: Fast / Standard / Slow
    - **Language**: Indonesia / English / Mix
    - **Audience**: Gen Z / Millennial / Professional / General
  - All injected into the system prompt for AI generation.

### Footage system

- **Reusable `FootageGallery` component**:
  - Filter chips: All / Photo / Video with counts.
  - Hover-to-play video previews (autoplay muted).
  - Type badges (`📷 photo` / `🎬 0:08s`).
  - **Multi-select** (toggle on/off).
  - Source attribution links (Pexels TOS-friendly).
- **Suggest keywords** per scene: AI proposes 6 Pexels-searchable keywords based on the scene's visual context + voiceover (1 token).
- **Scene visual AI improve**: regenerate `visualContext` + `brollPrompt` based on hook + voiceover (1 token).

### List page upgrades

- Project cards now show:
  - Cover thumbnail (first selected footage of the first scene).
  - Scene count, estimated total duration, footage progress.
- **Search bar** + **status filter chips** (All / Ready / Draft / Generating / Error) with counts.
- **Sort**: Recent / Title / Duration.

### Persistent render jobs

- New `RenderJobsTracker` (bottom-right floating card) tracks compose-video jobs in `localStorage`.
- Render keeps polling even if user navigates between pages.
- Toast + auto-download offer when a render completes.
- Mounted on both editor and list page.

### Backend changes

- `directorNotes` column added to `script_scene` table.
- `getProjects` enriched with `sceneCount`, `totalEstimatedDuration`, `scenesWithFootage`, `coverThumbnail`.
- `generateScript` now accepts `style` options (tone, hook style, pacing, language, audience) and injects descriptors into the AI system prompt.
- New endpoints:
  - `POST /scenes/:id/suggest-keywords` — AI keyword suggestion.
  - `POST /scenes/:id/improve-visual` — AI visual rewrite.

---

## Video Clips

### Foundation: real video preview

- **HTML5 video player** with HTTP range streaming (new `GET /:id/stream` endpoint).
- **Live preview overlay** that mirrors the final render in real-time:
  - Aspect frame respects 9:16 / 1:1 / 16:9 / 4:5.
  - Crop offset visualized with horizontal pan.
  - Subtitle styles render live (font, size, color, outline, drop shadow).
  - **Per-word highlight** during playback (matches backend ASS karaoke output).
  - Title overlay visible during the first 4 seconds of the segment.
  - Loop, play/pause, restart, mute, progress bar.

### Visual timeline with audio waveform

- Timeline renders **all segments color-coded by viral score** (pink / orange / amber / blue / grey).
- **Audio waveform** layer (peaks decoded server-side, stored as JSONB) — instantly shows speech vs. silence.
- Per-minute tick marks.
- Click to seek; **Shift-click empty space** to add a custom segment at that point.
- Playhead indicator follows current playback time.

### Segment management

- **Add custom segment** (timeline shift-click, transcript shift-click range, or `+ Add` button).
- **Duplicate**, **Split** (with slider for split point), **Delete** segment.
- **Alternate Hook Titles**: AI suggests 5 variations for A/B testing (1 token).
- Per-segment editor with start/end sliders, hook title input.
- Smart polling — no constant 3s polling once status is `ready`.

### Subtitle & title styles

- **Real ASS subtitle output** (replacing static SRT):
  - **Word-highlight** — each word turns highlight color when spoken.
  - **Karaoke** — sweep fill effect (`\K` / `\kf`).
  - **Fade-in** — `\fad(150,80)` per line.
- Outline width + color, drop shadow toggle, highlight color picker.
- Title rendered as ASS Dialogue (no more drawtext escape headaches).
- **Style presets**: 5 subtitle presets (Classic White, Karaoke Yellow, Word Highlight Green, Minimal Bottom, Bold Impact) and 4 title presets (Top Impact, Center Bold, Yellow Bar, Bottom Clean) — one click to apply.

### Aspect ratio + Smart Crop

- Output aspect ratio selectable: **9:16 / 1:1 / 16:9 / 4:5** with correct crop math per format.
- Manual crop offset slider (-1 … 1) for horizontal pan when source is wider than target.
- **Smart Crop button** — uses the browser's native `FaceDetector` API (Chrome / Edge):
  - Samples 8 frames across the segment.
  - Computes average face X position.
  - Auto-sets `cropOffsetX` to keep the speaker centered.
  - Graceful fallback if API not available.

### Interactive transcript

- Word-level transcript panel:
  - Click word → seek video.
  - **Shift-click word** → mark range and create a segment from transcript.
  - Live highlight current word during playback.
  - Auto-grouped into pseudo-paragraphs (gap > 2s).

### Batch export

- Per-clip checkbox in the segment list.
- "Export Selected" or "Export All" button with **token cost preview**.
- Each export queued separately in Bull (`@nestjs/bull`).

### Persistent export jobs

- `ExportJobsTracker` floating card, bottom-right.
- Polls project status, toasts + auto-download when an export shows up in `project.exports`.
- Mounted on both editor and list pages — track from anywhere.

### URL metadata + file upload

- Create dialog has **two tabs**:
  - **From URL**: yt-dlp `--dump-json` preview (thumbnail, title, uploader, duration). Warns if duration > 60 minutes.
  - **Upload File**: drag/drop area, real-time XHR upload progress bar, accepts MP4/MOV/WebM up to 1 GB and 60 min.
- Uploaded files skip the download step in the analyze pipeline.

### B-roll / Cutaway editor (Level B realistic editor)

A full b-roll overlay system, integrated end-to-end.

**Search & library**:
- Pexels footage search (photos + videos) and Google Images via the shared `FootageService`.
- Filter chips: All / Photo / Video.
- Hover-to-play video previews.
- AI-suggested keywords.

**Per-overlay editor**:
- Timing (start / end sliders).
- **Mode**:
  - **PIP** (picture-in-picture, default) with X / Y / Size sliders (0 … 1 normalized).
  - **Full** (full screen overlay).
  - **Side** (placement variant).
- **Transitions**: Cut / Fade / Slide (fade implemented via libavfilter alpha fade).
- **Audio ducking** toggle + level slider — source audio is reduced while overlay is active.
- Attribution metadata kept for compliance.

**Rendering**:
- Backend builds a **complex `-filter_complex` graph** with one `-i` per asset:
  - Crop + scale base layer.
  - Per overlay: scale, optional alpha fade, overlay with `enable='between(t,A,B)'`.
  - ASS subtitles burned **on top** of the composited video.
  - Audio chain with per-range volume reductions for ducking.

**Live preview**:
- B-roll overlays render in the HTML5 player with the same timing & positioning as the final ffmpeg output, including fade transitions.

**AI Auto-Cutaway** ⭐:
- One-click button at the top of the b-roll panel.
- Sends transcript with word-level timing to the AI.
- AI identifies imageable phrases (concrete visual referents).
- For each phrase: keyword + timing + suggested mode (PIP / full).
- Auto-fetches Pexels footage and inserts overlays into `brollPlan`.
- Cost: 2 tokens (vs. ~15-30 tokens for manual search per phrase).

### Save preset / template

- New `videoClipPreset` table stores per-user named presets.
- Each preset captures: subtitle style, title style, aspect ratio, crop offset.
- `PresetMenu` dropdown in the editor:
  - List with star/favorite indicator.
  - Click preset → instant apply.
  - "Save Current" dialog to capture current config with name + description.
  - Star toggle, delete confirmation.

### List page upgrades

- Card thumbnails (auto-extracted from video at the 5s mark, cached).
- Top viral score badge for ready projects.
- Search box, smart polling (only when there are processing projects).

### Backend additions

**Schema**:
- `video_clip_projects.thumbnail_path` (text)
- `video_clip_projects.metadata` (jsonb)
- `video_clip_projects.waveform` (jsonb, 600-bucket peak array)
- `video_clip_projects.broll_plan` (jsonb default `[]`)
- `video_clip_preset` table (user-scoped presets)

**Service methods**:
- `extractThumbnail`, `extractWaveform`, `fetchVideoMetadata`
- `createProjectFromFile` (multer upload path)
- `addCustomSegment`, `deleteSegment`, `duplicateSegment`, `splitSegment`
- `generateAlternateHooks`
- `searchBrollFootage`, `getBrollPlan`, `addBrollItem`, `updateBrollItem`, `deleteBrollItem`, `suggestBrollKeywords`, `autoCutaway`
- `downloadBrollAssets` (asset cache for ffmpeg overlay)
- `listPresets`, `createPreset`, `updatePreset`, `deletePreset`

**Endpoints (controller)**:
- `POST /video-clips/upload` — multer file upload (max 1 GB).
- `POST /video-clips/fetch-metadata` — yt-dlp metadata preview.
- `GET /video-clips/:id/stream` — HTTP range streaming.
- `GET /video-clips/:id/thumbnail` — cached JPG with `Cache-Control`.
- Segment CRUD: `POST /:id/segments`, `DELETE /:id/segments/:i`, `POST /:id/segments/:i/duplicate`, `POST /:id/segments/:i/split`, `POST /:id/segments/:i/alternate-hooks`.
- B-roll: `POST /:id/broll/search`, `GET /:id/broll`, `POST /:id/broll`, `PATCH /:id/broll/:itemId`, `DELETE /:id/broll/:itemId`, `POST /:id/broll/suggest`, `POST /:id/broll/auto-cutaway`.
- Batch export: `POST /export-batch`.
- Presets: `GET /presets`, `POST /presets`, `PATCH /presets/:id`, `DELETE /presets/:id`.

**Render pipeline**:
- `clipAndExport` extended to support `aspectRatio`, `cropOffsetX`, `brollItems`, `brollAssets`.
- Falls back to simple single-input pipeline when there are no overlays.

---

## Database migrations

Three migrations were applied:

1. `script_scene.director_notes` (text)
2. `video_clip_projects.thumbnail_path`, `metadata`, `waveform`, `broll_plan`
3. New table: `video_clip_preset`

All applied via `drizzle-kit push --force` against the working database.

---

## Token usage summary

| Action | Cost |
|---|---|
| Generate video script (with style options) | 1 token |
| Regenerate scene voiceover | 1 token |
| Regenerate project field (headline, caption, etc.) | 1 token |
| Suggest footage keywords (script) | 1 token |
| Improve scene visual (script) | 1 token |
| Suggest b-roll keywords (clips) | 1 token |
| Alternate hooks for clip | 1 token |
| **Auto-Cutaway AI** (full b-roll plan) | **2 tokens** |
| Analyze video clip | 50 tokens |
| Export clip (per clip, with or without b-roll) | 30 tokens |

---

## Files added (frontend)

```
frontend/src/app/(dashboard)/video-scripts/[id]/_components/
├── footage-gallery.tsx
├── generate-script-dialog.tsx
├── render-jobs-tracker.tsx
├── script-stats-bar.tsx
├── script-style-controls.tsx
└── storyboard-view.tsx

frontend/src/app/(dashboard)/video-clips/[id]/_components/
├── alternate-hooks-dialog.tsx
├── broll-panel.tsx
├── export-jobs-tracker.tsx
├── index.ts
├── interactive-transcript.tsx
├── preset-menu.tsx
├── segment-timeline.tsx
├── smart-crop-button.tsx
├── style-controls.tsx
├── types.ts
└── video-preview.tsx
```

---

## Try it

After `git pull`:

```bash
cd backend
npm install
npm run start:dev   # auto-applies any pending TS changes
```

```bash
cd frontend
npm install
npm run dev
```

The editor pages live at:
- `/video-scripts/[id]`
- `/video-clips/[id]`

Quick wins to verify:
1. Open a video clip project → Auto-Cutaway tab → click "Auto B-roll" — observe transcript-aware overlays appear.
2. Save current style as a preset, switch project, apply preset.
3. In a video script editor, switch to Storyboard view, click any scene to jump to its detail.
4. Try the new Generate dialog with style chips on a fresh script project.

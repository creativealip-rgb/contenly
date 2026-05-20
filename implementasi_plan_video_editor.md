# 🎬 AI Video Production Studio — Implementation Plan

Web app **all-in-one** untuk video editor: AI-powered script, voiceover, transcription, stock footage, thumbnail, motion graphics, auto-edit, vertical crop, music generator, dan repurpose long-to-shorts. Pengganti Submagic + Opus Clip + Adobe Auto Reframe + Epidemic Sound dalam satu dashboard.

---

## 📋 Daftar Isi

1. [Goals & Scope](#1-goals--scope)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Struktur Folder](#4-struktur-folder)
5. [Database Schema](#5-database-schema)
6. [Daftar Fitur & Detail Implementasi](#6-daftar-fitur--detail-implementasi)
7. [API Endpoints](#7-api-endpoints)
8. [UI/UX Flow](#8-uiux-flow)
9. [Roadmap & Milestones](#9-roadmap--milestones)
10. [Setup & Deployment](#10-setup--deployment)
11. [Estimasi Biaya](#11-estimasi-biaya)
12. [Risiko & Mitigasi](#12-risiko--mitigasi)

---

## 1. Goals & Scope

### 🎯 Goal
Bikin **dashboard terpadu** yang membantu video editor:
- Generate script, hook, title, description (SEO-friendly)
- Generate voiceover natural (OpenAI TTS / ElevenLabs)
- Transcribe audio/video jadi subtitle SRT (Whisper)
- Cari & download stock footage (Pexels/Pixabay)
- Generate thumbnail (DALL-E 3)
- Saran B-roll & shot list otomatis dari script
- Library aset (Lottie icons, template teks animasi)
- Manajemen project per video

### 🚫 Out of Scope (versi awal)
- Video editor timeline interaktif (terlalu kompleks, pakai CapCut/Premiere aja)
- Download YouTube footage (langgar ToS)
- Integrasi langsung dengan CapCut/Submagic/Descript (no public API)
- Real-time collaboration multi-user

### 👥 Target User
Mulai dari **personal use** (cuma lo). Nanti bisa di-extend ke multi-user.

---

## 2. Tech Stack

| Layer | Tool | Alasan |
|-------|------|--------|
| **Framework** | Next.js 14 (App Router) | Frontend + backend di satu repo, deploy gampang |
| **Language** | TypeScript | Type-safe, bantu hindari bug |
| **Styling** | Tailwind CSS + shadcn/ui | Cepat bikin UI bagus & konsisten |
| **State** | Zustand + React Query | Simple state + server caching |
| **Database** | Supabase (Postgres) | Free tier, auth bawaan, storage bawaan |
| **Storage** | Supabase Storage | Simpan file audio/video/thumbnail |
| **Auth** | Supabase Auth (email magic link) | Simple, no password needed |
| **AI Provider** | OpenAI SDK | Lo udah punya key |
| **Stock API** | Pexels API + Pixabay API | Gratis, dokumentasi bagus |
| **Optional AI** | Replicate (Flux, Kling) | Untuk fitur lanjutan |
| **TTS Lanjutan** | ElevenLabs API | Suara lebih natural (opsional) |
| **Render Engine** | Remotion | Render video MP4/WebM dari React components |
| **Lottie** | lottie-web + LottieFiles API | Icon animasi |
| **Video Processing** | ffmpeg (fluent-ffmpeg) | Cut, crop, merge video |
| **Object Detection** | YOLOv8 / MediaPipe via Replicate | Auto-reframe, subject tracking |
| **Music AI** | MusicGen / Suno via Replicate | Generate background music |
| **Beat Detection** | Librosa (Python via Modal/Replicate) | Sync video ke beat |
| **Job Queue** | Trigger.dev / Inngest | Background process untuk render lama |
| **Resumable Upload** | Tus.io / Uppy | Upload video gede tanpa putus |
| **Deploy** | Vercel | Gratis, 1-click deploy |
| **Package Manager** | pnpm | Lebih cepat, hemat disk |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (User)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Next.js Frontend (React + Tailwind + shadcn/ui)    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Vercel Serverless)         │
│                                                             │
│  /api/script    /api/voice    /api/transcribe              │
│  /api/footage   /api/thumbnail /api/broll                   │
│  /api/projects  /api/assets                                 │
└──────┬────────────┬──────────────┬──────────────┬──────────┘
       │            │              │              │
       ▼            ▼              ▼              ▼
  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐
  │ OpenAI │  │  Pexels  │  │ Replicate│  │  Supabase   │
  │  API   │  │  Pixabay │  │  (opsi)  │  │  DB+Storage │
  └────────┘  └──────────┘  └──────────┘  └─────────────┘
```

### Alur Request Tipikal (contoh: generate voiceover)
1. User input teks di UI → klik "Generate"
2. Frontend POST ke `/api/voice` dengan teks + voice setting
3. API route panggil OpenAI TTS → dapat audio buffer
4. API upload audio ke Supabase Storage → dapat URL
5. API simpan metadata ke DB (project_id, file_url, durasi)
6. Frontend dapat URL → tampilkan player + tombol download

---

## 4. Struktur Folder

```
kiro-chat/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + topbar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── projects/
│   │   │   ├── page.tsx          # List semua project
│   │   │   └── [id]/page.tsx     # Detail project
│   │   ├── script/page.tsx       # Script generator
│   │   ├── voice/page.tsx        # Voiceover generator
│   │   ├── transcribe/page.tsx   # Audio → subtitle
│   │   ├── footage/page.tsx      # Pexels/Pixabay search
│   │   ├── thumbnail/page.tsx    # Thumbnail generator
│   │   ├── broll/page.tsx        # B-roll suggester
│   │   └── assets/page.tsx       # Library Lottie + template
│   ├── api/
│   │   ├── script/route.ts
│   │   ├── voice/route.ts
│   │   ├── transcribe/route.ts
│   │   ├── footage/search/route.ts
│   │   ├── thumbnail/route.ts
│   │   ├── broll/route.ts
│   │   ├── projects/route.ts
│   │   └── projects/[id]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn components
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── ProjectCard.tsx
│   ├── features/
│   │   ├── ScriptForm.tsx
│   │   ├── VoiceForm.tsx
│   │   ├── FootageGrid.tsx
│   │   └── ...
│   └── shared/
│       ├── AudioPlayer.tsx
│       ├── VideoPreview.tsx
│       └── DownloadButton.tsx
├── lib/
│   ├── ai/
│   │   ├── openai.ts             # Wrapper GPT, TTS, Whisper, DALL-E
│   │   ├── elevenlabs.ts         # Optional
│   │   └── replicate.ts          # Optional
│   ├── stock/
│   │   ├── pexels.ts
│   │   └── pixabay.ts
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── storage.ts            # Helper upload
│   ├── prompts/                  # Prompt templates
│   │   ├── script.ts
│   │   ├── hook.ts
│   │   ├── title-seo.ts
│   │   └── broll.ts
│   ├── utils.ts
│   └── types.ts
├── store/
│   └── useProjectStore.ts        # Zustand
├── public/
├── supabase/
│   └── migrations/               # SQL schema
├── .env.local.example
├── .env.local                    # Local env (gitignored)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. Database Schema

### Table: `users` (managed by Supabase Auth, otomatis ada)

### Table: `projects`
```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  topic text,
  target_duration int,                  -- dalam detik
  language text default 'id',
  status text default 'draft',          -- draft | in_progress | done
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Table: `scripts`
```sql
create table scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type text,                            -- full_script | hook | title | description
  content text not null,
  metadata jsonb,                       -- { tone, style, model_used }
  created_at timestamptz default now()
);
```

### Table: `voiceovers`
```sql
create table voiceovers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  text text not null,
  voice text,                           -- alloy, nova, dll
  provider text default 'openai',       -- openai | elevenlabs
  audio_url text,                       -- URL di Supabase Storage
  duration_sec float,
  created_at timestamptz default now()
);
```

### Table: `transcriptions`
```sql
create table transcriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_url text,
  language text,
  text text,
  srt_url text,                         -- URL file .srt
  vtt_url text,                         -- URL file .vtt
  segments jsonb,                       -- timestamps per segment
  created_at timestamptz default now()
);
```

### Table: `footage_saves`
```sql
create table footage_saves (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source text,                          -- pexels | pixabay
  external_id text,
  preview_url text,
  download_url text,
  metadata jsonb,                       -- { width, height, duration, photographer }
  created_at timestamptz default now()
);
```

### Table: `thumbnails`
```sql
create table thumbnails (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  prompt text,
  image_url text,
  model text default 'dall-e-3',
  created_at timestamptz default now()
);
```

### Table: `broll_suggestions`
```sql
create table broll_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  script_id uuid references scripts(id),
  suggestions jsonb,                    -- array of { timestamp, keyword, search_query }
  created_at timestamptz default now()
);
```

### Table: `auto_edits`
```sql
create table auto_edits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_video_url text not null,
  source_duration_sec int,
  status text default 'pending',        -- pending | processing | done | failed
  clips jsonb,                          -- array of { start, end, score, hook, preview_url, caption_data }
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
```

### Table: `reframes`
```sql
create table reframes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_video_url text not null,
  output_ratio text,                    -- 9:16 | 1:1 | 4:5
  output_url text,
  tracking_data jsonb,                  -- bounding box per frame
  status text default 'pending',
  created_at timestamptz default now()
);
```

### Table: `music_generations`
```sql
create table music_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  prompt text,
  mood text,
  genre text,
  bpm int,
  duration_sec int,
  audio_url text,
  beat_markers jsonb,                   -- array of timestamps
  provider text default 'musicgen',
  created_at timestamptz default now()
);
```

### Table: `repurpose_jobs`
```sql
create table repurpose_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_video_url text not null,
  status text default 'pending',
  outputs jsonb,                        -- array of { type, url, platform_target, duration }
  zip_url text,                         -- final ZIP all outputs
  error_message text,
  progress int default 0,               -- 0-100
  created_at timestamptz default now()
);
```

### Row Level Security (RLS)
Semua table aktifkan RLS dengan policy: `user_id = auth.uid()` agar tiap user cuma bisa akses datanya sendiri.

---

## 6. Daftar Fitur & Detail Implementasi

### 🟢 Fase 1 — MVP (1-2 hari kerja)

#### F1. Script & Content Generator
**Yang dibikin:**
- Form input: topik, target durasi, tone (formal/casual/edukatif/lucu), bahasa
- Output 4 hal sekaligus dalam 1 generate:
  1. **Script penuh** (struktur: hook → intro → main → CTA → outro)
  2. **5 variasi Hook** (3 detik pertama yang bikin orang nggak skip)
  3. **5 variasi Judul** (SEO-friendly, max 60 char)
  4. **Description** (SEO + timestamp)

**Tech:**
- API: `POST /api/script`
- Model: `gpt-4o-mini` (murah & cepat) atau `gpt-4o` (kualitas)
- Stream response biar UX cepat (streaming text)

**Prompt template:** disimpan di `lib/prompts/script.ts`

---

#### F2. Voiceover Generator (OpenAI TTS)
**Yang dibikin:**
- Textarea (max 4000 char per request)
- Pilih voice: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- Pilih kecepatan (0.25x - 4x)
- Pilih kualitas: `tts-1` (cepat) atau `tts-1-hd` (kualitas)
- Tombol "Generate" → audio player + download MP3
- Auto-save ke Supabase Storage

**Tech:**
- API: `POST /api/voice`
- Endpoint OpenAI: `audio.speech.create`
- Output: MP3 → upload ke Supabase Storage → return URL

**Catatan:** OpenAI TTS bahasa Indonesia OK tapi nggak sebagus ElevenLabs. Gue siapin slot untuk ElevenLabs di fase 2.

---

#### F3. Stock Footage Search (Pexels + Pixabay)
**Yang dibikin:**
- Search bar
- Filter: type (video/photo), orientation (landscape/portrait), duration min/max
- Grid hasil dengan preview hover (autoplay video preview)
- Tombol download langsung (resolusi pilihan)
- Tombol "Save to project" → simpan ke `footage_saves`

**Tech:**
- API: `GET /api/footage/search?q=...&type=video&source=pexels`
- Pexels API: `https://api.pexels.com/videos/search`
- Pixabay API: `https://pixabay.com/api/videos/`
- Cache hasil di React Query 5 menit

---

### 🟡 Fase 2 — Tools Lanjutan (2-3 hari)

#### F4. Audio/Video Transcription (Whisper)
**Yang dibikin:**
- Upload file audio/video (drag & drop, max 25 MB per OpenAI limit)
- Atau paste URL YouTube? **Skip dulu** (legal grey area, mending upload manual)
- Pilih bahasa (auto-detect / Indonesia / English)
- Output:
  - Plain text transcript
  - File `.srt` siap import ke Premiere/CapCut
  - File `.vtt` untuk web
  - JSON dengan timestamp tiap segment

**Tech:**
- API: `POST /api/transcribe` (multipart upload)
- Whisper endpoint: `audio.transcriptions.create` dengan `response_format: verbose_json`
- Convert segments → SRT/VTT format
- Upload `.srt` & `.vtt` ke Supabase Storage

---

#### F5. Thumbnail Generator (DALL-E 3)
**Yang dibikin:**
- Input: judul video + style (cinematic, cartoon, realistic, dll)
- Auto-bikin prompt yang detail dari judul (pakai GPT)
- Generate 1-4 variasi
- Aspect ratio: 16:9 (1792x1024)
- Tombol "Re-generate" + "Edit prompt manual"
- Download PNG

**Tech:**
- API: `POST /api/thumbnail`
- Endpoint: `images.generate` model `dall-e-3`
- Pipeline: Title → GPT enhance jadi prompt visual → DALL-E 3 → simpan

---

#### F6. B-Roll Suggester (Smart!)
**Yang dibikin:**
Ini fitur unggulan. Workflow:
1. User paste script (atau pilih dari script yang udah digenerate)
2. GPT analisa → bikin shot list per kalimat/paragraf:
   ```json
   [
     { "timestamp": "0:00-0:05", "scene": "Hook tentang AI editing", "keywords": ["computer typing", "ai brain", "fast workflow"] },
     { "timestamp": "0:05-0:15", "scene": "Demo tools", "keywords": ["video editing software", "timeline"] }
   ]
   ```
3. Untuk tiap keyword → auto search Pexels → tampilkan 3 candidate per scene
4. User klik "Save all" → semua footage tersimpan ke project

**Tech:**
- API: `POST /api/broll`
- Pipeline: Script → GPT (function calling) → array shots → loop search Pexels → return grid

---

### 🟣 Fase 2.5 — Motion Graphics Studio (FITUR UNGGULAN!)

Ini yang bikin tools lo beda dari yang lain. Tools-tools macam Submagic/CapCut nggak punya ini se-fleksibel ini.

#### F-MG1. Motion Graphics Template Library
**Yang dibikin:**
- Halaman `/motion/templates` dengan grid template (~100+ preset)
- Kategori: Title, Lower Third, Subscribe, Counter, Bullet, Logo, Transition, Callout
- Tiap template:
  - Live preview (auto-play hover)
  - Editor inline: teks, warna, font, durasi, easing
  - Preview real-time saat ngedit
  - Tombol "Render" → pilih format (MP4 / WebM transparent / PNG sequence)

**Tech:**
- Render engine: **Remotion** (`@remotion/renderer`)
- Template = React components di `components/motion/templates/*.tsx`
- Server render via API `/api/motion/render` → return URL download
- Storage hasil render di Supabase Storage

**Format output:**
| Format | Use Case |
|--------|----------|
| MP4 (h264) | Drag ke timeline editor, ada background |
| WebM (vp9 alpha) | Overlay di atas footage (transparan) |
| MOV (ProRes 4444) | Quality maks untuk Premiere/DaVinci |
| PNG sequence (ZIP) | Frame-by-frame, max quality |
| Lottie JSON | Untuk web/aplikasi |

**Daftar template awal (MVP):**
- 5 Title cards (modern, neon, glitch, typewriter, kinetic)
- 5 Lower thirds (clean, gradient, neon, minimalist, corporate)
- 3 Subscribe button (YouTube classic, modern, animated)
- 3 Number counter (clean, neon, retro)
- 3 Bullet reveal (slide, bounce, fade)
- 3 Logo intro (zoom, particle, glitch)
- 5 Transition (swipe, zoom, glitch, blur, dissolve)
- 3 Callout box (highlight, arrow, frame)

Total: ~30 template untuk start. Bisa terus ditambah.

---

#### F-MG2. AI Custom Animation Generator (KILLER!)
**Yang dibikin:**
- Halaman `/motion/ai-generate`
- Form input:
  - Deskripsi animasi (textarea, prompt natural language)
  - Durasi (1-15 detik)
  - Resolusi (720p/1080p/4K)
  - Aspect ratio (16:9 / 9:16 / 1:1 / 4:5)
  - Style hints (modern, retro, neon, minimalist, dll)
  - Background (transparan / warna solid / gradient)
- Pipeline:
  1. User submit prompt
  2. GPT-4 generate kode Remotion (React component)
  3. Validasi kode (sandbox check, no malicious code)
  4. Render via Remotion server-side
  5. Return MP4/WebM URL

**Contoh prompt yang harus jalan:**
- "Teks 'WELCOME' yang muncul kata per huruf dengan bouncing effect"
- "Animasi counter angka dari 0 ke 1 juta dalam 3 detik dengan font futuristic"
- "3 bullet point muncul satu-satu dari kiri dengan icon emoji"
- "Logo intro dengan partikel berkumpul ke tengah lalu fade out"
- "Quote 'Don't quit your daydream' style TikTok dengan kata muncul satu-satu"

**Tech:**
- API: `POST /api/motion/ai-generate`
- Pipeline: Prompt → GPT-4 (function calling, output kode TSX) → simpan code → Remotion render
- **Security critical:** sandbox eksekusi kode (Vercel Sandbox / Docker isolated). User code TIDAK boleh akses fs/network.
- Cache hasil agar prompt sama nggak di-render 2x

**Library helper untuk AI:**
Gue siapin "primitive components" yang AI tinggal pakai:
- `<AnimatedText effect="bounce|fade|slide|glitch|typewriter" />`
- `<NumberCounter from={0} to={100} />`
- `<RevealList items={[...]} stagger={0.2} />`
- `<ParticleEffect type="confetti|stars|dots" />`
- `<Logo src="..." effect="zoom|spin|reveal" />`

Dengan begini, GPT cukup compose komponen, nggak perlu nulis animasi raw → output lebih reliable.

---

#### F-MG3. Lottie Icon Animator
**Yang dibikin:**
- Search Lottie dari LottieFiles API
- Preview & customize (warna, speed, loop)
- Export ke MP4/WebM/GIF
- Save ke project

**Tech:**
- LottieFiles Public API
- `lottie-web` untuk render
- Convert Lottie → video pakai Remotion `<Lottie />` component

---

#### F-MG4. Auto-Caption Animasi Viral (TikTok Style)
**Yang dibikin:**
- Upload audio/video
- Whisper → dapat transcript dengan timestamp per kata
- Pilih style caption: classic, neon, retro, glitch, karaoke, bouncing, highlight
- Pilih font, warna, animasi muncul (pop, slide, bounce)
- Render output WebM transparent (overlay) atau MP4 dengan background

**Ini fitur yang dibayar mahal di Submagic ($16/mo). Lo bisa bikin sendiri.**

**Tech:**
- Whisper word-level timestamps (`timestamp_granularities: ["word"]`)
- Remotion render dengan timing per kata
- Template caption animation

---

#### F-MG5. Animated Background Generator
**Yang dibikin:**
- Generate background animasi: gradient mesh, particle, geometric, waveform
- Customize warna, speed, density
- Loop seamless (untuk video panjang)
- Export MP4/WebM

**Tech:**
- Custom React components dengan canvas/SVG animation
- Render via Remotion

---

### 🔴 Fase 2.7 — Pro Editing Suite (KILLER FEATURES!)

Ini fitur yang bikin tools lo setara dengan kombinasi **Opus Clip ($29) + Submagic ($16) + Auto Reframe ($55) + Epidemic Sound ($15) = $115/mo**. Lo bikin sendiri = jauh lebih hemat.

#### F-PRO1. Auto Edit dari Long Footage (Opus Clip Killer!)
**Yang dibikin:**
Workflow ajaib:
1. User upload video panjang (max 2 jam) — bisa raw footage atau podcast
2. Optional: paste topik/angle yang pengen di-highlight
3. AI lakukan magic:
   - Whisper transcribe full + word-level timestamps
   - GPT analisa → detect "high-impact moments" (climax, quote, joke, reveal)
   - Score tiap segment: hook potential, retention prediction
   - Pick 3-10 best clips (durasi 30-90 detik)
4. Output:
   - Preview MP4 tiap clip (auto-cut + auto-caption)
   - Timeline JSON (timecode in/out + reasoning)
   - Export ke Premiere `.prproj` / DaVinci `.drp` / CapCut JSON

**Pipeline detail:**
```
Long video → Whisper (verbose_json + word timestamps)
          → GPT-4 analisa transcript + detect highlights
          → Output array: [{ start, end, score, hook, caption_style }]
          → Loop: ffmpeg cut → Remotion add caption → render preview
```

**Tech:**
- API: `POST /api/auto-edit`
- ffmpeg untuk cutting (via fluent-ffmpeg di server)
- Background job queue (Inngest atau Trigger.dev) — render lama, jangan block
- Notif via toast/email kalau selesai

**Tantangan & solusi:**
- Video gede → upload pakai Tus (resumable upload) atau langsung ke Supabase Storage
- Render lama → background queue + progress bar real-time

---

#### F-PRO2. Vertical Crop AI / Smart Reframe (Adobe Killer!)
**Yang dibikin:**
- Upload video horizontal (16:9)
- Pilih output ratio: 9:16 (TikTok/Reels), 1:1 (Insta feed), 4:5 (Insta portrait)
- AI deteksi subjek → auto-pan kamera follow subjek
- Smooth tracking (no jitter)
- Manual override: user bisa kunci tracking ke titik tertentu

**Tech:**
- API: `POST /api/reframe`
- Object detection: **YOLOv8** atau **MediaPipe** via Replicate
- Face tracking: dlib atau MediaPipe Face Mesh
- Pipeline:
  1. Extract frames per detik
  2. Detect bounding box subjek di tiap frame
  3. Smooth tracking (Kalman filter atau simple moving average)
  4. ffmpeg crop dengan dynamic position
  5. Output MP4 + reframe data JSON

**Output bonus:**
- Bikin SEMUA aspect ratio sekaligus (sat set!)
- 1 upload = dapat 9:16, 1:1, 4:5 → multi-platform deploy

---

#### F-PRO3. AI Music Generator + Beat Sync
**Yang dibikin:**

**Bagian A: Generate Music**
- Form input:
  - Mood (upbeat, chill, dramatic, epic, lo-fi, dll)
  - Genre (electronic, cinematic, jazz, ambient, dll)
  - BPM (60-180)
  - Durasi (15 detik - 5 menit)
  - Reference (optional): "mirip lagu di video XYZ"
- Output: MP3 + metadata BPM, key, mood

**Bagian B: Beat Sync (BONUS)**
- Upload audio (musik atau voiceover)
- AI detect beat/transient
- Output: timestamp tiap beat → bisa dipakai untuk:
  - Auto-cut footage at beat (visual punch)
  - Sync animasi ke beat
  - Generate "beat marker" file untuk Premiere

**Tech:**
- Music generation: **MusicGen** (Meta, via Replicate, ~$0.05/video) atau **Suno API** (lebih bagus tapi unofficial)
- Beat detection: **Librosa** atau **Essentia** (Python, run di Replicate atau Modal.com)
- API: `POST /api/music/generate` & `POST /api/music/beat-detect`

**Use case real:**
1. Generate music 60 detik upbeat
2. Beat detection → 60 beats per menit
3. Edit video lo cut tepat di beat → hasil "punchy" professional

---

#### F-PRO4. Long-form to Shorts Repurposer (Multi-Output)
**Yang dibikin:**
Mirip F-PRO1 tapi spesifik untuk repurpose konten:

User upload:
- YouTube long-form video (download atau upload manual)
- Atau podcast audio + visual

AI lakukan:
1. Transcribe + analisa
2. Bikin **multiple short variants** dari 1 video panjang:
   - 5x clips 30-60 detik untuk TikTok
   - 3x clips untuk YouTube Shorts (60 detik)
   - 2x quote cards untuk Instagram (15 detik)
   - 1x highlight reel 5 menit
3. Tiap clip otomatis:
   - Auto-crop vertical (pakai F-PRO2)
   - Auto-caption viral style (pakai F-MG4)
   - Auto-thumbnail (pakai F5)
   - Title + description SEO

**Output:** ZIP dengan 10+ video siap upload ke berbagai platform.

**Tech:**
- API: `POST /api/repurpose`
- Combine semua fitur: F-PRO1 + F-PRO2 + F-MG4 + F5
- Background queue wajib (proses bisa 10-30 menit untuk video panjang)

**Killer combo:**
1 jam podcast → 10 short video viral siap posting di TikTok/Reels/Shorts. Yang biasanya butuh 1 hari editing manual.

---

### 🔵 Fase 3 — Nice to Have (kalau sempat)

#### F7. Hook & Title A/B Tester
- Generate 10 hook → ranking pakai GPT (mana yang paling viral-potential)

#### F8. Project Manager
- List semua project, search, filter
- Tiap project punya semua resource (script, voice, footage, thumbnail) terkait

#### F9. Lottie Icon Library
- Embed iframe LottieFiles search atau pakai API mereka
- Save favorit ke project

#### F10. Audio Cleanup (opsional, perlu Replicate)
- Upload audio kotor → model `audio-super-resolution` di Replicate
- Hasilnya lebih bersih, mirip Adobe Podcast Enhance

#### F11. ElevenLabs Voice (kualitas lebih bagus untuk bahasa Indo)
- Tambah toggle provider di voice generator
- User isi API key sendiri (atau pakai key shared)

---

## 7. API Endpoints

| Method | Path | Body / Query | Response |
|--------|------|--------------|----------|
| POST | `/api/script` | `{ topic, duration, tone, language, projectId? }` | `{ script, hooks[], titles[], description }` |
| POST | `/api/voice` | `{ text, voice, speed, model, projectId? }` | `{ audioUrl, duration }` |
| POST | `/api/transcribe` | FormData: `file`, `language?`, `projectId?` | `{ text, srtUrl, vttUrl, segments }` |
| GET | `/api/footage/search` | `?q=&type=&orientation=&source=` | `{ results: [...] }` |
| POST | `/api/footage/save` | `{ projectId, source, externalId, ... }` | `{ id }` |
| POST | `/api/thumbnail` | `{ title, style, projectId? }` | `{ imageUrl }` |
| POST | `/api/broll` | `{ script, projectId? }` | `{ shots: [...] }` |
| POST | `/api/motion/render` | `{ templateId, props, format, projectId? }` | `{ videoUrl }` |
| POST | `/api/motion/ai-generate` | `{ prompt, duration, resolution, aspectRatio, projectId? }` | `{ videoUrl, generatedCode }` |
| GET | `/api/motion/templates` | `?category=` | `{ templates: [...] }` |
| POST | `/api/motion/lottie/render` | `{ lottieJson, customization, format }` | `{ videoUrl }` |
| POST | `/api/motion/captions` | `{ audioUrl, style, projectId? }` | `{ videoUrl }` |
| POST | `/api/auto-edit` | `{ videoUrl, topic?, projectId? }` | `{ jobId }` (async) |
| GET | `/api/auto-edit/[jobId]` | — | `{ status, progress, clips: [...] }` |
| POST | `/api/reframe` | `{ videoUrl, ratios: ["9:16","1:1"], projectId? }` | `{ jobId }` (async) |
| GET | `/api/reframe/[jobId]` | — | `{ status, outputs: [...] }` |
| POST | `/api/music/generate` | `{ mood, genre, bpm, duration, projectId? }` | `{ audioUrl, beatMarkers }` |
| POST | `/api/music/beat-detect` | `{ audioUrl }` | `{ bpm, beats: [...timestamps] }` |
| POST | `/api/repurpose` | `{ videoUrl, targets: ["tiktok","shorts","reels"], projectId? }` | `{ jobId }` (async) |
| GET | `/api/repurpose/[jobId]` | — | `{ status, progress, outputs: [...], zipUrl }` |
| GET | `/api/projects` | — | `{ projects: [...] }` |
| POST | `/api/projects` | `{ title, description, ... }` | `{ project }` |
| GET | `/api/projects/[id]` | — | `{ project, scripts, voiceovers, ... }` |
| PATCH | `/api/projects/[id]` | `{ ...updates }` | `{ project }` |
| DELETE | `/api/projects/[id]` | — | `{ ok }` |

**Auth:** semua endpoint cek session Supabase. Kalau belum login → 401.

**Rate limit:** simple in-memory (atau pakai Upstash Redis kalau multi-user) — max 10 request/menit per user.

---

## 8. UI/UX Flow

### Layout Utama (Dashboard)
```
┌────────────────────────────────────────────────────┐
│  [Logo]  Studio                    [User] [Logout] │
├──────────┬─────────────────────────────────────────┤
│          │                                         │
│ Sidebar  │           Main Content Area             │
│          │                                         │
│ 🏠 Home  │   (halaman aktif tampil di sini)        │
│ 📁 Proj  │                                         │
│ ✍️ Script│                                         │
│ 🎙️ Voice │                                         │
│ 📝 Trans │                                         │
│ 🎬 Footg │                                         │
│ 🖼️ Thumb │                                         │
│ 🎯 BRoll │                                         │
│ 📦 Asset │                                         │
│          │                                         │
│ ⚙️ Settg │                                         │
└──────────┴─────────────────────────────────────────┘
```

### Halaman Dashboard Home
- **Card stats:** total project, total voiceover dibuat, total footage saved
- **Recent projects** (4 card terakhir)
- **Quick actions:** "New Script", "New Voiceover", "Search Footage"

### Halaman Project Detail
Tab-based:
- **Overview** — info dasar
- **Scripts** — semua script di project ini
- **Voiceovers** — semua audio di project ini
- **Footage** — saved footage
- **Thumbnails** — thumbnail yang di-generate
- **Export** — download semua dalam ZIP (script.txt + audio.mp3 + footage list + .srt + thumbnail.png)

### Settings
- API keys (OpenAI, Pexels, Pixabay, ElevenLabs optional)
- Default voice & model
- Default bahasa

---

## 9. Roadmap & Milestones

### 🏁 Milestone 1: Foundation (Day 1)
- [ ] Setup Next.js 14 + TS + Tailwind + shadcn/ui
- [ ] Setup Supabase project (DB + Auth + Storage)
- [ ] Run SQL migration (semua tables + RLS)
- [ ] Setup `.env.local` template
- [ ] Buat layout dasar (sidebar + topbar)
- [ ] Halaman login (magic link)

### 🏁 Milestone 2: MVP Features (Day 2-3)
- [ ] **F1** Script Generator (full + hook + title + desc)
- [ ] **F2** Voiceover Generator (OpenAI TTS)
- [ ] **F3** Stock Footage Search (Pexels + Pixabay)
- [ ] Halaman Projects (CRUD)
- [ ] Connect semua fitur ke project (save resource ke project tertentu)

### 🏁 Milestone 3: Advanced Tools (Day 4-5)
- [ ] **F4** Whisper Transcription + SRT/VTT export
- [ ] **F5** Thumbnail Generator (DALL-E 3)
- [ ] **F6** B-Roll Suggester (combo GPT + Pexels)

### 🏁 Milestone 4: Motion Graphics Studio (Day 6-9)
- [ ] Setup Remotion (init + render pipeline)
- [ ] **F-MG1** Template library (30 template awal)
- [ ] Editor inline (edit teks/warna/durasi + live preview)
- [ ] Render API + storage hasil
- [ ] **F-MG2** AI Custom Animation Generator
- [ ] Library "primitive components" untuk AI
- [ ] Sandbox renderer (security)
- [ ] **F-MG3** Lottie integration
- [ ] **F-MG4** Auto-caption viral style (Submagic killer)
- [ ] **F-MG5** Animated background generator

### 🏁 Milestone 5: Pro Editing Suite (Day 11-15)
- [ ] Setup background job queue (Trigger.dev / Inngest)
- [ ] Setup ffmpeg pipeline di server
- [ ] Setup Replicate integration (YOLOv8, MusicGen, Librosa)
- [ ] Setup resumable upload (Tus.io) untuk file gede
- [ ] **F-PRO1** Auto Edit dari Long Footage
  - [ ] Upload + transcribe pipeline
  - [ ] AI highlight detection (GPT-4)
  - [ ] Render preview tiap clip
  - [ ] Export Premiere/DaVinci/CapCut format
- [ ] **F-PRO2** Smart Reframe (Vertical Crop)
  - [ ] Object detection pipeline
  - [ ] Smooth tracking algorithm
  - [ ] Multi-ratio output
- [ ] **F-PRO3** AI Music Generator
  - [ ] MusicGen integration
  - [ ] Beat detection (Librosa)
  - [ ] Beat marker export
- [ ] **F-PRO4** Long-form to Shorts Repurposer
  - [ ] Combine semua fitur jadi 1 pipeline
  - [ ] ZIP generator output

### 🏁 Milestone 6: Polish & Deploy (Day 16)
- [ ] Settings page
- [ ] Export project as ZIP
- [ ] Loading states + error handling lengkap
- [ ] Responsive mobile (minimal usable)
- [ ] Deploy ke Vercel
- [ ] Buat dokumentasi pakai (README)

### 🏁 Milestone 7 (Opsional): Pro Features
- [ ] **F11** ElevenLabs integration
- [ ] **F10** Audio cleanup via Replicate
- [ ] **F7** Hook A/B tester
- [ ] Export Premiere Pro `.prproj` / DaVinci `.drp` (auto-place footage di timeline)

---

## 10. Setup & Deployment

### A. Prasyarat
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Akun: [Supabase](https://supabase.com), [Vercel](https://vercel.com), [Pexels API](https://pexels.com/api), [Pixabay API](https://pixabay.com/api/docs/)
- API key OpenAI (✅ udah punya)

### B. Environment Variables (`.env.local`)
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stock Footage (gratis)
PEXELS_API_KEY=...
PIXABAY_API_KEY=...

# Optional
ELEVENLABS_API_KEY=
REPLICATE_API_TOKEN=
```

### C. Setup Steps
```bash
# 1. Init project
pnpm create next-app@latest kiro-chat --ts --tailwind --app --src-dir=false

# 2. Install deps
pnpm add @supabase/supabase-js @supabase/ssr openai zustand @tanstack/react-query
pnpm add lucide-react clsx tailwind-merge zod react-hook-form @hookform/resolvers
pnpm add -D @types/node

# 3. Setup shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input textarea card dialog tabs select toast

# 4. Run dev
pnpm dev
```

### D. Supabase Setup
1. Bikin project baru di [supabase.com](https://supabase.com)
2. Run SQL migration di SQL Editor (file `supabase/migrations/001_init.sql`)
3. Bikin storage bucket: `audio`, `transcripts`, `thumbnails` (public)
4. Aktifkan email magic link auth
5. Copy URL + anon key + service role key ke `.env.local`

### E. Deploy ke Vercel
```bash
# Push ke GitHub
git add . && git commit -m "init" && git push

# Connect ke Vercel
# - Import repo
# - Tambahin semua env vars di Vercel dashboard
# - Deploy
```

---

## 11. Estimasi Biaya

### Setup Lengkap (semua fitur termasuk Pro Editing Suite)

| Service | Pemakaian | Biaya |
|---------|-----------|-------|
| OpenAI GPT-4o-mini | ~50 script/bulan | $1-3 |
| OpenAI TTS-1 | ~30 menit audio | $4 |
| OpenAI Whisper | ~5 jam transcribe (untuk auto-edit) | $1.80 |
| OpenAI DALL-E 3 | ~20 thumbnail | $0.80 |
| Replicate (YOLOv8, MusicGen, Librosa, Remotion) | ~30 video diproses | $5-15 |
| Trigger.dev / Inngest (job queue) | <50k runs | **Gratis** |
| Pexels + Pixabay | unlimited | **Gratis** |
| Supabase Pro (DB+Storage 100GB) | upload video gede | $25 |
| Vercel Pro (timeout 300s, perlu untuk render) | unlimited | $20 |
| **TOTAL Pro** | | **~$55-65/bulan** |

### Versi Hemat (MVP only — Fase 1 + 2)

| Service | Biaya |
|---------|-------|
| OpenAI semua | ~$10 |
| Pexels + Pixabay | Gratis |
| Supabase Free + Vercel Hobby | Gratis |
| **TOTAL MVP only** | **~$10/bulan** |

### Pendekatan Bertahap (recommended)

1. **Bulan 1-2:** MVP only (~$10/mo) — validasi value
2. **Bulan 3+:** Upgrade ke full stack kalau lo udah aktif pakai (~$55/mo)

### Kalau ditambah opsional:
- ElevenLabs Starter: $5/mo (30 ribu karakter)
- ElevenLabs Voice Cloning: $22/mo

### Value Comparison vs Tools Komersial

Kalau pakai tools komersial dengan fungsi setara:
| Tool | Fungsi | Biaya |
|------|--------|-------|
| Submagic | Auto-caption viral | $16/mo |
| Opus Clip | Long-to-shorts | $29/mo |
| Adobe Auto Reframe | Vertical crop | $55/mo (perlu Premiere) |
| Epidemic Sound | Background music | $15/mo |
| ElevenLabs | Voice cloning | $22/mo |
| **TOTAL komersial** | | **~$137/mo** |

**Saving lo: ~$72-82/bulan = $850-1000/tahun.** 💰

---

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| API key OpenAI bocor | Tagihan membengkak | Simpan di env vars, jangan commit. Set spending limit di OpenAI dashboard ($20/bulan) |
| Whisper limit 25MB | File video gede error | Validasi di frontend + saran convert ke audio dulu (atau split chunk) |
| OpenAI TTS bahasa Indo kurang natural | Suara robotik | Fallback ke ElevenLabs (fase 2) |
| Pexels rate limit (200/jam) | User stuck | Cache hasil + tampilkan error message ramah |
| Storage Supabase 1GB cepat penuh | Nggak bisa upload baru | Tambah feature "delete old files" atau upgrade ke Pro ($25/mo) |
| Cost membengkak | Boncos | Add usage tracking per user + limit harian |
| Output GPT halusinasi | Script ngawur | Prompt engineering ketat + validasi output |
| AI generate kode malicious | Server kena exploit | Sandbox eksekusi (Vercel Sandbox/Docker), whitelist API yang boleh dipakai, no fs/network access |
| Render Remotion lambat di Vercel | Timeout | Pakai render queue (Inngest/Trigger.dev) atau Remotion Lambda |
| Render queue antri panjang | User nunggu lama | Tampilkan progress + email notif kalau selesai |
| Auto-edit hasil kurang akurat | Clip terpilih nggak menarik | User bisa override pilihan AI + manual select segment |
| Reframe AI miss subjek | Crop salah, subjek motong | Kasih preview sebelum render + manual override tracking point |
| Upload video gede gagal | User frustrated | Pakai resumable upload (Tus.io) — bisa resume kalau koneksi putus |
| ffmpeg crash di server | Render gagal | Set timeout + retry logic + fallback ke alternatif (Remotion-only) |
| MusicGen output kualitas | Hasil musik pas-pasan | Generate 3 variasi sekaligus, user pilih yang terbaik |
| Beat detection meleset | Sync visual nggak match | Manual adjust beat marker + visual editor untuk fine-tune |
| Replicate cost membengkak | Boncos | Set monthly limit di Replicate dashboard + cache hasil identik |
| YouTube footage download | Legal issue | **TIDAK** dibikin. User harus download manual & upload sendiri |

---

## 🎯 Rencana Eksekusi (kalau lo OK)

Gue saranin start dari **Milestone 1 + sebagian Milestone 2**:
1. Setup project + Supabase
2. Auth + dashboard layout
3. Fitur Script Generator (full)
4. Fitur Voiceover (full)
5. Fitur Footage Search (full)

Setelah itu lo bisa langsung pakai untuk produksi video. Sisanya kita iterasi sambil jalan.

---

## ✅ Next Step

Konfirmasi dulu:
1. **Setuju sama plan ini?** Ada yang mau diubah/tambah?
2. **Mau langsung gue mulai code Milestone 1?**
3. **Akun Supabase** udah punya / mau gue siapin dulu strukturnya?
4. **Pexels/Pixabay API key** mau lo daftarin sendiri atau skip dulu?

Kalau bilang **"gas, mulai code"** — gue langsung eksekusi Milestone 1.

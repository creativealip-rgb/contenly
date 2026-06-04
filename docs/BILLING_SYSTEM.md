# Contenly Billing System Documentation

> Last updated: 2026-06-04
> Branch: `feat/major-improvements`

---

## Overview

Contenly uses **2-layer billing** untuk mengontrol penggunaan AI features:

1. **Layer 1 — Kuota Kategori** (primary): Count-based monthly limit per kategori
2. **Layer 2 — Kredit** (fallback): Pay-as-you-go credits when quota exceeded

Tidak ada token pool / monthlyQuota — sistem sudah di-refactor ke model yang lebih sederhana.

---

## Arsitektur

```
User Request → ensureBilling(userId, featureType)
                    │
                    ▼
            ┌─ Layer 1: checkCategoryLimit ─┐
            │  Cek kuota bulanan kategori    │
            │  (count-based, reset tiap bulan)│
            └──────────┬─────────────────────┘
                       │
              ┌────────┴────────┐
              │ Within limit?   │
              └───┬─────────┬───┘
                YES         NO
                 │           │
                 ▼           ▼
           {allowed:    ┌─ Layer 2: Check Kredit ─┐
            true}       │  Cek saldo kredit user   │
                        └──────┬──────────┬────────┘
                               │          │
                          Cukup?      Tidak cukup
                               │          │
                               ▼          ▼
                        {allowed:    {allowed:
                         true,        false}
                         usingKredit:
                         true}
```

Setelah AI work selesai → `recordUsage()` → increment count + deduct kredit jika overflow.

---

## Kategori & Limits

### 4 Kategori Kuota

| Kategori | Monthly Limit Key | Fitur yang Masuk |
|----------|------------------|------------------|
| **Artikel** | `ARTICLE_GENERATION` | Article generation |
| **IG Carousel** | `INSTAGRAM_GENERATION` | IG carousel, storyboard, hashtag |
| **Video** | `VIDEO_GENERATION` | Video script, clips, hooks, B-roll, TTS, cutaway |
| **Gambar** | `IMAGE_GENERATION` | Image gen, slide image, thumbnail, motion graphics, text overlay |

### Paket & Limits

| Fitur | Free | Starter (Rp 99K) | Pro (Rp 399K) | Business (Rp 999K) |
|-------|------|-------------------|---------------|---------------------|
| Artikel | 5 | 40 | 150 | 400 |
| IG Carousel | 30 | 100 | 300 | 800 |
| Video | 3 | 20 | 80 | 200 |
| Gambar | 2 | 8 | 15 | 35 |
| WordPress Sites | 1 | 2 | 5 | 10 |
| Auto Sync | ❌ | ✅ (120min) | ✅ (60min) | ✅ (15min) |
| View Boost | ❌ | ❌ | ✅ | ✅ |
| Trend Radar | ❌ | ✅ | ✅ | ✅ |

---

## Feature-to-Category Mapping

### Artikel Category
- `ARTICLE_GENERATION` → `ARTICLE_GENERATION`

### IG Carousel Category
- `INSTAGRAM_GENERATION` → `INSTAGRAM_GENERATION`
- `STORYBOARD_GENERATION` → `INSTAGRAM_GENERATION`
- `HASHTAG_GENERATION` → `INSTAGRAM_GENERATION`

### Video Category
- `VIDEO_GENERATION` → `VIDEO_GENERATION`
- `VIDEO_SCRIPT` → `VIDEO_GENERATION`
- `ALTERNATE_HOOKS` → `VIDEO_GENERATION`
- `BROLL_KEYWORDS` → `VIDEO_GENERATION`
- `SUGGEST_FOOTAGE_KEYWORDS` → `VIDEO_GENERATION`
- `AUTO_CUTAWAY` → `VIDEO_GENERATION`
- `TTS_PREVIEW` → `VIDEO_GENERATION`
- `TTS_VOICEOVER` → `VIDEO_GENERATION`
- `REGENERATE_FIELD` → `VIDEO_GENERATION`
- `REGENERATE_VOICEOVER` → `VIDEO_GENERATION`
- `IMPROVE_VISUAL` → `VIDEO_GENERATION`
- `VIDEO_ANALYSIS` → `VIDEO_GENERATION`
- `VIDEO_EXPORT` → `VIDEO_GENERATION`

### Gambar Category
- `IMAGE_GENERATION` → `IMAGE_GENERATION`
- `SLIDE_IMAGE` → `IMAGE_GENERATION`
- `THUMBNAIL_GENERATION` → `IMAGE_GENERATION`
- `MOTION_GRAPHICS_RENDER` → `IMAGE_GENERATION`
- `TEXT_OVERLAY` → `IMAGE_GENERATION`

---

## Kredit System

Kredit adalah **pay-as-you-go fallback** ketika kuota kategori habis.

- Tidak expired
- Tidak reset tiap bulan
- Dibeli terpisah dari paket
- Hanya terpakai ketika kuota kategori sudah habis

### Kredit Cost per Operasi

| Feature | Kredit Cost |
|---------|-------------|
| ARTICLE_GENERATION | 3 |
| STORYBOARD_GENERATION | 3 |
| VIDEO_SCRIPT | 3 |
| HASHTAG_GENERATION | 2 |
| ALTERNATE_HOOKS | 1 |
| BROLL_KEYWORDS | 1 |
| SUGGEST_FOOTAGE_KEYWORDS | 1 |
| AUTO_CUTAWAY | 2 |
| TTS_PREVIEW | 1 |
| TTS_VOICEOVER | 1 |
| REGENERATE_FIELD | 1 |
| REGENERATE_VOICEOVER | 1 |
| IMPROVE_VISUAL | 1 |
| IMAGE_GENERATION | 2 |
| SLIDE_IMAGE | 2 |
| THUMBNAIL_GENERATION | 2 |
| MOTION_GRAPHICS_RENDER | 2 |
| TEXT_OVERLAY | 2 |
| VIDEO_ANALYSIS | 50 |
| VIDEO_EXPORT | 30 |

---

## API Endpoints

### `GET /billing/balance`
Returns current balance with per-category usage.

**Response:**
```json
{
  "credits": 0,
  "tier": "BUSINESS",
  "categories": {
    "artikel":    { "used": 0,  "limit": 400, "label": "Artikel" },
    "instagram":  { "used": 21, "limit": 800, "label": "IG Carousel" },
    "video":      { "used": 0,  "limit": 200, "label": "Video" },
    "gambar":     { "used": 1,  "limit": 35,  "label": "Gambar" }
  }
}
```

### `GET /billing/usage-breakdown`
Returns per-feature usage detail for current month.

**Response:**
```json
{
  "breakdown": [
    { "feature": "INSTAGRAM_GENERATION", "label": "IG Carousel", "count": 21 },
    { "feature": "IMAGE_GENERATION", "label": "Generate Gambar", "count": 1 },
    { "feature": "AI_CHAT", "label": "AI Chat", "count": 1 }
  ]
}
```

### `GET /billing/transactions`
Returns transaction history (purchases, usage, refunds).

### `GET /billing/subscriptions`
Returns current subscription info.

---

## Core Methods (BillingService)

### `ensureBilling(userId, featureType): Promise<BillingResult>`
Main billing gate. Called BEFORE AI work.

```typescript
interface BillingResult {
  allowed: boolean
  usingKredit: boolean
  kreditCost: number
  reason?: string  // Only when allowed=false
}
```

**Flow:**
1. `checkCategoryLimit(userId, featureType)` → maps feature to category → checks monthly count
2. If within limit → `{ allowed: true, usingKredit: false }`
3. If over limit → check `KREDIT_COSTS[featureType]`
4. If no kredit cost defined → `{ allowed: false, reason: "..." }`
5. If user has enough kredit → `{ allowed: true, usingKredit: true, kreditCost }`
6. If kredit insufficient → `{ allowed: false, reason: "..." }`

### `recordUsage(userId, featureType, billingResult)`
Called AFTER successful AI work.

1. Increments category count in `daily_usage` table
2. Deducts kredits if `billingResult.usingKredit === true`

### `checkCategoryLimit(userId, featureType): Promise<boolean>`
Maps feature to category, then checks if current month usage < limit.

### `checkDailyLimit(userId, featureType): Promise<boolean>`
Raw limit check: queries `daily_usage` table, sums count for current month, compares to `BILLING_TIERS[tier].monthlyLimits[featureType]`.

---

## Database Tables

### `daily_usage`
Tracks per-feature usage counts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | text | FK to user |
| date | timestamp | Usage date (normalized to day start) |
| feature_type | enum | Feature type (e.g., `IMAGE_GENERATION`) |
| count | integer | Usage count for that day |

**Unique constraint:** `(user_id, date, feature_type)`

### `token_balance`
Stores kredit balance per user.

| Column | Type | Description |
|--------|------|-------------|
| user_id | text | FK to user |
| credits | integer | Current kredit balance |
| total_used | integer | Total kredits ever used |

### `transaction`
Transaction log for purchases, usage, refunds.

---

## Billing Enforcement Points

### Where `ensureBilling` is called:

| Service | Method | Feature Type |
|---------|--------|--------------|
| ai.service | generateContent | ARTICLE_GENERATION |
| ai.service | generateImage | IMAGE_GENERATION |
| ai.service | chatWithAI | AI_CHAT (special: daily msg limit) |
| instagram-studio | generateStoryboard | STORYBOARD_GENERATION |
| instagram-studio | generateSingleImage | SLIDE_IMAGE |
| instagram-studio | generateAllImages | SLIDE_IMAGE (per-slide) |
| instagram-studio | generateAllTextOverlays | SLIDE_IMAGE (per-slide) |
| instagram-studio | generateTextOverlay | TEXT_OVERLAY |
| video-script | generateVideoScript | VIDEO_SCRIPT |
| video-script | regenerateField | REGENERATE_FIELD |
| video-script | regenerateVoiceover | REGENERATE_VOICEOVER |
| video-script | suggestFootageKeywords | SUGGEST_FOOTAGE_KEYWORDS |
| video-script | improveVisual | IMPROVE_VISUAL |
| video-script | generateTtsPreview | TTS_PREVIEW |
| video-script | generateFullVoiceover | TTS_VOICEOVER |
| video-script | generateThumbnail | THUMBNAIL_GENERATION |
| video-script | generateNewScript | VIDEO_SCRIPT |
| video-clip | analyzeVideo | VIDEO_ANALYSIS |
| video-clip | generateAlternateHooks | ALTERNATE_HOOKS |
| video-clip | exportVideo | VIDEO_EXPORT |
| video-clip | generateBrollKeywords | BROLL_KEYWORDS |
| video-clip | autoCutaway | AUTO_CUTAWAY |
| motion-graphics | renderTemplate | MOTION_GRAPHICS_RENDER |
| motion-graphics | renderCaption | MOTION_GRAPHICS_RENDER |
| motion-graphics | renderCompose | MOTION_GRAPHICS_RENDER |
| motion-graphics | batchRender | MOTION_GRAPHICS_RENDER (per-item) |

---

## Special Cases

### AI Chat
- FREE plan: **blocked entirely** ("AI Chat tersedia untuk plan STARTER ke atas")
- STARTER+: 30 messages/day limit (separate from category system)
- Tracked via `AI_CHAT` feature type

### Batch Operations (IG Studio generateAllImages)
- `ensureBilling` dipanggil **per slide** di dalam loop
- Jika limit tercapai di tengah batch, slide yang tersisa di-skip dengan error message
- Results array berisi status success/failure per slide

### Monthly Reset
- Kuota kategori reset otomatis setiap awal bulan
- Query: `WHERE date >= monthStart` (first day of current month)
- Kredit TIDAK reset — persist across months

---

## Frontend Components

### Billing Page (`/billing`)
- **Saldo Card**: 4 category cards (Artikel, IG Carousel, Video, Gambar) + Kredit
- **Usage Breakdown**: Per-feature horizontal bar chart (via `GET /billing/usage-breakdown`)
- **Plan Cards**: Free, Pro, Business with feature lists
- **Transaction History**: Recent transactions table

### Header
- Kredit badge: shows current credit balance
- Bell icon: notifications for successful generations + low kredit warnings

---

## Error Messages

| Scenario | Message |
|----------|---------|
| Category limit exceeded, no kredit cost | "Kuota {Kategori} sudah habis bulanan ini. Upgrade plan untuk menambah jatah." |
| Category limit exceeded, kredit insufficient | "Kuota {Kategori} habis dan kredit tidak cukup (butuh {N} kredit). Upgrade plan atau beli kredit tambahan." |
| AI Chat on FREE plan | "AI Chat tidak tersedia di paket Free. Upgrade ke Starter atau Business." |
| AI Chat daily limit | "Batas harian AI Chat tercapai (30 pesan/hari)." |

---

## Key Files

| File | Description |
|------|-------------|
| `backend/src/modules/billing/billing.constants.ts` | Tier configs, feature mapping, kredit costs |
| `backend/src/modules/billing/billing.service.ts` | Core billing logic (ensureBilling, recordUsage, etc.) |
| `backend/src/modules/billing/billing.controller.ts` | API endpoints |
| `backend/src/modules/billing/billing.module.ts` | NestJS module |
| `backend/src/db/schema.ts` | Database schema (daily_usage, token_balance, transaction) |
| `frontend/src/app/(dashboard)/billing/page.tsx` | Billing page UI |
| `frontend/src/hooks/use-billing.ts` | React hooks for billing data |

---

## Changelog

### 2026-06-04
- Separated IG Carousel and Video into distinct categories (was combined as "Video & IG")
- Added per-feature usage breakdown endpoint
- Fixed: `generateAllImages` billing check moved inside per-slide loop
- Fixed: `generateSingleImage` now calls `recordUsage` (was missing)
- 4 category cards in billing page (was 3)
- Plan descriptions show separate IG + Video limits

### 2026-06-03
- Added billing to AI Chat (FREE blocked, STARTER+ 30 msg/day)
- Added billing to Suggest Keywords (1 kredit → Video category)
- Refactored to 2-layer model (removed monthlyQuota token pool)
- Added notifications for all AI features
- Provider status + model config admin tabs

### 2026-06-02
- Initial category-based billing implementation
- Added IMAGE_GENERATION, SLIDE_IMAGE, THUMBNAIL_GENERATION to feature types
- Fixed TOKEN_COSTS inconsistency
- FREE plan monthlyQuota increased from 5 to 20 (later removed entirely)

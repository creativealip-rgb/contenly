# Contenly - Remaining Implementation Plan

## Completed Features (Phase 1-2)

### ✅ Backend
- [x] 15+ Carousel Templates with colors, gradients, typography
- [x] Template-based AI prompts
- [x] PDF Export for carousel
- [x] Video Script Enhancement (duration, emojis, hashtags, caption)
- [x] Video Script Export (JSON, SRT, TXT, Caption)
- [x] Instagram Direct Post Integration (user can input their own token)
- [x] Auto-Hashtag for Carousel
- [x] Brand Kit System (multiple for Enterprise)
- [x] Content Calendar with scheduled posts

### ✅ Frontend
- [x] Template Selector UI with visual previews
- [x] Carousel Preview Mode (modal navigation)
- [x] Drag & Drop Reorder Slides
- [x] Instagram Connect UI with token guide

---

## Remaining Features (Phase 3)

### 1. Content Calendar Frontend Page
**Priority:** High

**Description:** Visual calendar to view and manage scheduled content

**Backend API Already Exists:**
- `GET /calendar` - List all scheduled content
- `GET /calendar/month/:year/:month` - Get month data
- `POST /calendar` - Create scheduled content
- `PATCH /calendar/:id` - Update
- `DELETE /calendar/:id` - Delete

**Implementation Needed:**
- New page: `/calendar`
- Calendar view (month/week)
- Drag & drop to reschedule
- Create/edit scheduled content modal
- Filter by platform (WordPress, Instagram, LinkedIn, Twitter)

---

### 2. Analytics Dashboard Enhancement
**Priority:** High

**Description:** Enhanced analytics with charts and custom metrics

**Implementation Needed:**
- Add chart library (recharts)
- Dashboard components:
  - Content performance over time
  - Top performing content
  - Platform breakdown
  - Engagement metrics
- Export analytics as PDF/CSV
- Custom date range picker

**Backend Enhancement Needed:**
- Add analytics tracking table
- Track views, clicks, engagement per content

---

### 3. Export Options Expansion
**Priority:** High

**Description:** More export formats and batch export

**Implementation Needed:**
- ZIP download for carousel (all images)
- Video script → MP3 voiceover preview (TTS)
- Batch export multiple projects
- Social media scheduler integration

**Backend APIs to Add:**
- `POST /instagram-studio/projects/:id/export/zip`
- `POST /video-scripts/:id/export/audio` (TTS)

---

### 4. Onboarding Flow
**Priority:** Medium

**Description:** Welcome flow for new users

**Implementation Needed:**
- Welcome modal for first-time users
- Step-by-step tutorial:
  1. Connect WordPress (optional)
  2. Create first carousel
  3. Export/Publish
- Tooltips for key features
- Skip option

**Storage:** User preferences or localStorage

---

## API Endpoints Summary

### Brand Kit
```
POST   /brand-kit              - Create brand kit
GET    /brand-kit             - List all
GET    /brand-kit/default     - Get default
GET    /brand-kit/:id         - Get by ID
PATCH  /brand-kit/:id         - Update
DELETE /brand-kit/:id        - Delete
POST   /brand-kit/:id/set-default
POST   /brand-kit/:id/apply/:projectId
```

### Calendar
```
POST   /calendar              - Create
GET    /calendar              - List all
GET    /calendar/upcoming     - Upcoming (default 7 days)
GET    /calendar/stats       - Statistics
GET    /calendar/month/:y/:m  - Month data
GET    /calendar/:id          - Get by ID
PATCH  /calendar/:id         - Update
DELETE /calendar/:id         - Delete
POST   /calendar/:id/publish  - Mark as published
```

### Instagram Studio
```
POST   /instagram-studio/projects/:id/hashtags - Auto-generate hashtags
```

---

## Database Tables

### New Tables Added
- `social_account` - User's connected social media accounts
- `brand_kit` - Brand profiles (multiple per user)
- `scheduled_content` - Calendar scheduled posts

### New Columns
- `instagram_project.template_id` - Selected template
- `instagram_slide.gradient_colors` - Gradient background colors
- `script_scene.emoji` - Scene mood emoji

---

## Timeline Recommendation

| Week | Feature |
|------|---------|
| Week 1 | Content Calendar Frontend |
| Week 2 | Analytics Dashboard |
| Week 3 | Export Options + TTS |
| Week 4 | Onboarding Flow |

---

## Notes

- All backend APIs are ready for consumption
- Frontend needs calendar page, analytics page, export enhancements
- Brand Kit can be managed from Settings page
- Instagram connect already works from Settings > Connections

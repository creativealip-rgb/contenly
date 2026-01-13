This is the finalized **Product Requirement Document (PRD)** for **Numedia AI Content Automator**. This plan is designed to be a high-performance, scalable MVP that leverages your expertise in React and Tailwind while solving the specific pain points of SEO agencies and content marketers.

---

# 🚀 Numedia AI: Product Blueprint (MVP)

## 1. Executive Summary

**Numedia AI** is an end-to-end content automation platform that turns any URL or RSS feed into unique, SEO-optimized WordPress posts. The goal is to reduce content creation time by **85%** while maintaining a high standard of uniqueness and search engine ranking.

---

## 2. Core Feature Specifications

### A. Source Analysis (The Ingestor)

* **Universal Scraper:** Capability to extract clean text from any URL, bypassing ads, navigation, and scripts.
* **RSS Auto-Detection:** Users add an RSS feed; the app automatically pulls new headlines into a "Pending" queue.
* **Metadata Extraction:** Capture original tags, categories, and featured image URLs to inform the AI.

### B. AI Transformation Engine

* **Context-Aware Rewriting:** Uses LLMs (GPT-4o/Claude 3.5) to change tone, structure, and length while preserving factual accuracy.
* **SEO Optimizer:** Automatic generation of Meta Titles, Descriptions, and slug suggestions.
* **AI Visuals:** Integration with DALL-E 3 to generate a unique, copyright-free featured image based on the new headline.

### C. WordPress Sync (The Bridge)

* **Direct API Integration:** Connect via WordPress Application Passwords or a custom Numedia Plugin.
* **Mapping Engine:** Map source categories to destination categories.
* **Status Control:** Send posts as `Draft`, `Private`, or `Published`.
* **Multi-Site Support:** Connect and manage multiple WordPress sites from one account.

### D. Authentication & User Management

* **Auth Methods:** Email/Password + OAuth (Google, GitHub).
* **Role-Based Access:** Admin (full access) vs Regular User (limited).
* **Session Management:** JWT tokens with refresh mechanism.
* **Password Recovery:** Email-based reset flow.

### E. Notification System

* **In-App Notifications:** Real-time alerts for job status (success/failure).
* **Email Notifications:** Optional alerts for low token balance, failed jobs, weekly reports.
* **Toast Messages:** Immediate feedback for user actions.

---

## 3. The Tech Stack

| Layer | Technology | Reason |
| --- | --- | --- |
| **Frontend** | **Next.js 14 (React)** | Server-side rendering for SEO and fast dashboard performance. |
| **Styling** | **Tailwind CSS** | Rapid UI development with a professional "SaaS" aesthetic. |
| **Backend** | **Node.js (NestJS)** | Excellent for handling API requests and CMS integrations. |
| **Database** | **PostgreSQL (Supabase)** | Robust relational data for user settings, logs, and token tracking. |
| **Auth** | **Supabase Auth** | Built-in OAuth, JWT, and session management. |
| **Queue/Worker** | **Redis + BullMQ** | Manages heavy AI and scraping tasks in the background. |
| **AI Processing** | **OpenAI API / LangChain** | Industry standard for text transformation and image generation. |

---

## 4. App Sitemap & Flow

### Page 0: Landing Page (Public)

* **Hero Section:** Headline, subheadline, CTA button.
* **Features Showcase:** 3-4 key feature highlights with icons.
* **Pricing Plans:** Free trial, Pro, Enterprise tiers.
* **Testimonials:** Social proof section.
* **Footer:** Links, contact, social media.

### Page 1: Overview Dashboard

* **KPI Widgets:** Total articles published, tokens remaining, active RSS feeds.
* **Recent Activity:** A list of the last 5 posts synced to WordPress.
* **Quick Actions:** Shortcuts to Content Lab, Add Feed, etc.

### Page 2: The Content Lab (The Core)

* **Input Zone:** URL paste field or "Pick from Feed" selector.
* **Live Transformation View:**
  * *Left Pane:* Scraped original content (Read-only).
  * *Right Pane:* AI Generated Editor (Editable via TipTap).
* **Configuration Sidebar:** Tone selection, SEO keyword input, and Image generation toggle.

### Page 3: RSS Feed Manager

* **Feed List:** All connected RSS feeds with status indicators.
* **Add/Edit Feed:** URL input, polling interval, auto-publish toggle.
* **Pending Queue:** Items fetched but not yet processed.
* **Feed Analytics:** Items fetched, success rate, last poll time.

### Page 4: Article History

* **Article Table:** All generated articles with filters (date, status, site).
* **Search:** Find articles by title or keyword.
* **Bulk Actions:** Re-publish, delete, export.
* **Article Detail:** View full content, edit, re-sync to WordPress.

### Page 5: Integration & CMS Settings

* **WP Connections:** List of connected WordPress sites (multi-site).
* **Add New Site:** URL, Username, and Application Password fields.
* **Category Mapping Table:** UI to link "Source A Category" to "My Site Category."
* **Connection Health:** Status check for each connected site.

### Page 6: Billing & Tokens

* **Token Balance:** Current balance with usage graph.
* **Buy Tokens:** Package options (Starter, Pro, Enterprise).
* **Transaction History:** All purchases and token usage.
* **Subscription Plans:** Monthly/yearly plans with auto-renewal.
* **Invoice Download:** PDF invoices for each transaction.

### Page 7: Account Settings

* **Profile:** Name, email, avatar.
* **Security:** Change password, enable 2FA.
* **API Keys:** Generate/revoke API keys for external integrations.
* **Notification Preferences:** Email alerts, in-app notifications.
* **Connected Accounts:** OAuth providers linked to account.

### Page 8: Analytics & Reporting

* **Content Performance:** Articles published over time.
* **Token Usage:** Daily/weekly/monthly consumption charts.
* **AI Success Rate:** Generation success vs failure rate.
* **WordPress Sync Stats:** Posts synced, failed syncs, retry queue.

---

## 5. The Operational Logic Flow

1. **Selection:** User selects a source (URL or RSS item).
2. **Processing:** System extracts data → AI generates a draft + SEO meta + Image.
3. **Refinement:** User makes minor edits in the "Content Lab" and checks the **SEO Score**.
4. **Distribution:** One click pushes the content, images, and metadata to the connected WordPress site.
5. **Tracking:** Article is logged in History with sync status and WordPress post ID.

---

## 6. Business Logic: Token System

To maintain profitability, the MVP will operate on a credit/token basis:

| Action | Token Cost |
| --- | --- |
| Article Generation | 1 Token |
| AI Image Generation | 2 Tokens |
| Plagiarism Check | 0.5 Tokens |
| Bulk Publish (10 articles) | 8 Tokens |

### Subscription Plans

| Plan | Price | Tokens/Month | Features |
| --- | --- | --- | --- |
| **Free Trial** | $0 | 10 | Basic features, 1 WP site |
| **Pro** | $29/mo | 100 | All features, 5 WP sites |
| **Enterprise** | $99/mo | 500 | Priority support, unlimited sites, API access |

---

## 7. API Documentation (Future)

* **REST API:** Endpoints for programmatic access.
* **Webhook Support:** Notify external systems on article publish.
* **API Key Auth:** Secure access with rate limiting.
* **Documentation:** Swagger/OpenAPI spec for developers.

---

## 8. Development Roadmap (3 Phases)

### Phase 1: The Foundation (Weeks 1-3)

* Build the Next.js/Tailwind Dashboard.
* Implement Authentication (Supabase Auth).
* Implement the URL Scraper and basic GPT-4 integration.
* Manual WordPress publishing via REST API.
* Account Settings page.

### Phase 2: Automation & Media (Weeks 4-6)

* Implement RSS feed polling and Feed Manager page.
* Integrate DALL-E 3 for image generation.
* Add the "Content Lab" split-screen editor.
* Article History page with search/filter.
* Basic Billing page (token display).

### Phase 3: Pro Features & Scale (Weeks 7-9)

* Bulk publishing (select 10 URLs and publish all at once).
* Social Media snippets (Auto-generate Twitter/FB captions for the post).
* Advanced SEO Plugin support (Yoast/RankMath).
* Full Billing integration (Stripe/Paddle).
* Analytics & Reporting dashboard.
* Landing page for marketing.

---

> [!TIP]
> **PM Insight for MVP Success:** Focus on the **WordPress Plugin/Connection** first. If the connection to the user's site is buggy, the AI features won't matter. Ensure the "One-Click Publish" feels like magic.

> [!IMPORTANT]
> **Priority Order:** Auth → Dashboard → Content Lab → WP Sync → RSS Manager → Billing → Analytics
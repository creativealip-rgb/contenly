# Contenly - AI Content Automation Platform

Contenly (formerly Camedia) adalah platform otomatisasi konten berbasis AI yang dirancang untuk mem streamline workflow dari penemuan konten hingga publikasi. Platform ini mengintegrasikan kemampuan scraping canggih, AI rewriting, dan publishing ke WordPress dalam satu dashboard terpadu.

## 🚀 Fitur Utama

### 1. 🧪 Content Lab
Pusat produksi konten dengan workspace 3-kolom.
- **Smart Scraper**: Ekstrak konten bersih dari URL mana pun menggunakan Puppeteer/Cheerio.
- **RSS Feed Integration**: Subscribe ke RSS feed untuk menemukan trending topics.
- **AI Transformer**: Tulis ulang konten dengan model AI yang customizable.
  - **Context Awareness**: Mempertahankan makna asli sambil menyesuaikan tone dan gaya.
  - **Customization**: Pilih Tone (Professional, Casual, SEO-Focused), Style, dan Target Length.
  - **SEO Tools**: Generate Title dan metadata SEO secara otomatis.
- **Direct Publishing**: Publish langsung ke WordPress yang terintegrasi.

### 2. 🎨 Instagram Studio (Carousel Maker)
Ubah ide teks atau artikel menjadi desain carousel visual.
- **Storyboard AI**: Generate struktur slide otomatis dari URL berita.
- **Visual Customizer**: Ubah font, warna background, dan posisi teks per slide.
- **Vision AI**: Integrasi AI vision untuk layout dan tipografi yang kontekstual.
- **Instant Export**: Download slide sebagai file gambar (JPG/PNG) siap upload.

### 3. 🎬 Video Script Studio
Solusi cepat untuk kreator konten video pendek (Reels/TikTok).
- **Script Generator**: Ubah link berita menjadi skrip video terstruktur.
- **Visual Prompts**: Saran B-Roll atau ilustrasi untuk setiap adegan.
- **Voiceover Script**: Skrip siap baca dengan durasi yang dioptimalkan.

### 4. 🛰️ Trend Radar (Discovery Lab)
Temukan tren viral sebelum kompetitor.
- **Global Trend Search**: Cari tren berdasarkan keyword (menggunakan Bing News).
- **Viral Potential Analysis**: AI menilai potensi viralitas topik.
- **Ignite Bridge**: Pindahkan tren menarik langsung ke Content Lab.

### 5. 📡 RSS Feed Management
Otomatisasi asupan informasi.
- **Multi-Source**: Kelola multiple RSS feed dalam satu tempat.
- **Scheduled Polling**: Interval sinkronisasi configurable.
- **Auto-Drafting**: AI membuat draf otomatis dari berita baru.
- **Category Mapping**: Map feed categories ke WordPress categories.

### 6. 📰 Article Management
- **Centralized Repository**: Kelola semua konten (Drafts, Published, Scheduled) di satu tempat.
- **Status Tracking**: Real-time status (Draft, Publishing, Published, Scheduled, Failed).
- **Persistence**: Semua artikel tersimpan aman di database.

### 7. 🔌 WordPress Integration
- **Multi-Site Support**: Connect dan kelola multiple WordPress websites.
- **Secure Connection**: Menggunakan WordPress Application Passwords dengan encrypted storage.
- **Category Sync**: Auto-fetch dan map WordPress categories.
- **Direct Publishing**: Publish atau schedule langsung dari dashboard.

### 8. 🔐 Authentication & Security
- **Better Auth**: Modern authentication system dengan session management.
- **OAuth Integration**: Login dengan Google, GitHub, dan provider lain.
- **API Key Authentication**: Akses API via API keys untuk integrasi eksternal.
- **Security Hardening**: Rate limiting, helmet, dan security headers.

### 9. 💰 Token System & Billing
Sistem monetisasi berbasis usage.
- **Token Ledger**: Transparansi penggunaan kredit untuk setiap aksi AI.
- **Subscription Tiers**: Dynamic subscription plans dengan feature gating.
- **Stripe Integration**: Pembayaran aman via Stripe.
- **Flexible Packages**: Top-up token sesuai kebutuhan.

### 10. 🔔 Notifications
- **In-App Notifications**: Notifikasi real-time untuk events penting.
- **Telegram Bot**: Integrasi bot Telegram untuk notifikasi mobile.
- **Socket.io**: Real-time updates untuk status publishing.

### 11. 📊 Analytics
- **Usage Analytics**: Track penggunaan token dan activity.
- **Content Performance**: Analisis performa konten yang dipublish.
- **Trend Insights**: Data-driven insights untuk content strategy.

### 12. ⚡ View Boost
- **Traffic Generation**: Sistem untuk meningkatkan view count.
- **Proxy Rotation**: Automated proxy untuk view generation.

### 13. 🛠️ Prompt Generator
- **AI Tools Dropdown**: Akses cepat ke berbagai AI tools dari sidebar.
- **Custom Prompts**: Generate prompts untuk berbagai use case.

## 📁 Project Structure

```
contently/
├── backend/                # NestJS API Server
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── ai/         # AI Service (OpenAI/LangChain)
│   │   │   ├── articles/   # Article management & persistence
│   │   │   ├── auth/       # Better Auth authentication
│   │   │   ├── billing/    # Stripe & token management
│   │   │   ├── feeds/      # RSS feed management
│   │   │   ├── instagram-studio/  # Carousel generation
│   │   │   ├── scraper/    # Content scraping (Puppeteer/Cheerio)
│   │   │   ├── trend-radar/       # Trend discovery
│   │   │   ├── video-script/      # Video script generation
│   │   │   ├── view-boost/        # View generation
│   │   │   ├── wordpress/         # WordPress integration
│   │   │   └── ...
│   │   ├── db/             # Drizzle ORM schema & config
│   │   └── ...
│   └── ...
│
├── frontend/               # Next.js 16 App (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/            # Auth pages (login/register)
│   │   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   │   ├── content-lab/   # Main generation UI
│   │   │   │   ├── instagram-studio/  # Carousel maker
│   │   │   │   ├── video-scripts/     # Video script studio
│   │   │   │   ├── trend-radar/       # Trend discovery
│   │   │   │   ├── articles/          # Article history
│   │   │   │   ├── feeds/             # RSS management
│   │   │   │   ├── integrations/      # WP Site management
│   │   │   │   ├── billing/           # Subscription & tokens
│   │   │   │   ├── settings/          # User settings
│   │   │   │   └── ...
│   │   ├── components/      # Reusable UI components (Shadcn UI)
│   │   └── ...
│   └── ...
│
└── docs/                    # Documentation
    ├── features.md
    ├── architecture.md
    └── deployment.md
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) & React Query
- **Forms**: React Hook Form + Zod
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)

### Backend
- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **AI/LLM**: OpenAI API + LangChain
- **Scraping**: Puppeteer + Cheerio + Readability
- **Queue**: Bull (Redis)
- **Realtime**: Socket.io
- **Email**: Resend
- **Payments**: Stripe
- **Security**: Helmet, Throttler

## 🚦 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL Database
- Redis (for queues)
- OpenAI API Key
- Stripe Account (for billing)
- Resend API Key (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/creativealip-rgb/contenly.git
   cd contenly
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Setup environment variables
   cp .env.example .env
   # Edit .env with your credentials
   
   # Run database migrations
   npm run db:push
   
   # Start development server
   npm run start:dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Setup environment variables
   cp .env.example .env.local
   # Edit .env.local with your API URL
   
   # Start development server
   npm run dev
   ```

4. **Access the App**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`
   - API Documentation: `http://localhost:3001/api` (Swagger)

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
cd backend
docker build -t contenly-backend .
docker run -p 3001:3001 contenly-backend
```

## 📝 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/contenly

# Better Auth
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3001

# OpenAI
OPENAI_API_KEY=sk-...

# Redis (for Bull queues)
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# WordPress (optional)
WP_DEFAULT_USER=admin
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001
```

## 🔑 API Key Authentication

Contenly mendukung autentikasi via API Key untuk integrasi eksternal:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/articles
```

Atau menggunakan header `X-API-Key`:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     http://localhost:3001/api/articles
```

## 📄 License

This project is licensed under the MIT License.

---

**Note**: Platform ini terus dikembangkan. Fitur-fitur baru ditambahkan secara berkala. Cek [docs/features.md](docs/features.md) untuk detail lebih lanjut.

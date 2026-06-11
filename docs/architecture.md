# Arsitektur Proyek Contently

Contently menggunakan arsitektur modern berbasis monorepo (split backend/frontend) untuk memastikan skalabilitas dan kecepatan pengembangan.

## 🛠 Stack Teknologi

### Frontend
-   **Framework**: Next.js 16 (App Router)
-   **Bahasa**: TypeScript
-   **Styling**: Tailwind CSS 4.0
-   **Animasi**: Framer Motion
-   **Komponen UI**: Shadcn/UI
-   **State Management**: Zustand & React Query (TanStack Query)
-   **Authentication**: Better Auth (Client SDK)

### Backend
-   **Framework**: NestJS (Node.js framework)
-   **Bahasa**: TypeScript
-   **Database**: PostgreSQL (via Supabase)
-   **ORM**: Drizzle ORM
-   **Queue System**: Bull (`@nestjs/bull`) dengan Redis
-   **AI Integration**: OpenAI SDK + LangChain
-   **Scraper**: Cheerio & Puppeteer (Advanced Scraper)

## 📁 Struktur Folder

### Backend (`/backend`)
-   `src/modules`: Setiap fitur diisolasi dalam modul NestJS sendiri (Encapsulation).
-   `src/db`: Konfigurasi database, schema Drizzle.
-   `src/auth`: Implementasi Better Auth server-side.
-   `src/main.ts`: Entry point dengan konfigurasi Global Prefix (`api/v1`).

### Frontend (`/frontend`)
-   `src/app/(dashboard)`: Seluruh fitur dashboard dengan layout yang konsisten.
-   `src/components`: UI components (atoms) dan complex widgets.
-   `src/lib`: Logic helper, API clients, dan shared utilities.
-   `src/stores`: Zustand state definitions.

## 🔄 Integrasi AI
Contently bertindak sebagai "Headless Content Engine". Backend berkomunikasi dengan LLM melalui OpenAI SDK dan LangChain. Data hasil AI kemudian diproses dan diformat sebelum dikirim ke frontend atau dipublikasikan ke WordPress.

## 💾 Model Data (Database)
Database dikelola menggunakan Drizzle ORM dengan tabel utama:
-   `users` & `sessions`: Otentikasi.
-   `articles`: Penyimpanan konten teks.
-   `instagram_projects`: Metadata untuk carousel studio.
-   `wp_sites`: Kredensial integrasi WordPress.
-   `rss_feeds`: Konfigurasi scraping terjadwal.

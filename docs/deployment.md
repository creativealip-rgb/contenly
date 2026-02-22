# Panduan Deployment & Setup

Ikuti langkah-langkah berikut untuk mengonfigurasi Contently di lingkungan pengembangan atau produksi.

## 📋 Persyaratan Sistem
-   **Node.js**: v18.x atau lebih baru
-   **Package Manager**: npm atau pnpm
-   **Database**: PostgreSQL (direkomendasikan via Supabase)
-   **Redis**: Diperlukan untuk sistem antrian BullMQ

## 🛠 Instalasi Lokal

### 1. Clone Repositori
```bash
git clone <repository-url>
cd contenly
```

### 2. Backend Setup
1.  Masuk ke folder backend:
    ```bash
    cd backend
    npm install
    ```
2.  Duplikat file `.env.example` menjadi `.env` dan isi variabel berikut:
    -   `DATABASE_URL`: Koneksi string PostgreSQL.
    -   `REDIS_HOST`/`PORT`: Lokasi server Redis.
    -   `OPENROUTER_API_KEY`: Key untuk akses AI.
    -   `BETTER_AUTH_SECRET`: String acak untuk keamanan sesi.
3.  Jalankan migration database:
    ```bash
    npx drizzle-kit push
    ```
4.  Start server:
    ```bash
    npm run start:dev
    ```

### 3. Frontend Setup
1.  Masuk ke folder frontend:
    ```bash
    cd ../frontend
    npm install
    ```
2.  Duplikat file `.env.example` ke `.env.local`:
    -   `NEXT_PUBLIC_API_URL`: `http://localhost:3001/api/v1`
3.  Start dev server:
    ```bash
    npm run dev
    ```

## 🚀 Deployment Produksi

### Backend (Dokploy/Docker)
Proyek ini mendukung deployment Docker. Gunakan Dokploy atau Docker Compose:
-   Pastikan `NODE_ENV` diset ke `production`.
-   Gunakan volume mount jika database dijalankan secara lokal di Docker.

### Frontend (Vercel/Netlify)
Frontend dapat di-deploy ke platform cloud:
-   Set `Build Command`: `npm run build`
-   Set `Output Directory`: `.next`
-   Tambahkan variabel `NEXT_PUBLIC_API_URL` yang mengarah ke domain backend Anda.

## 🧹 Maintenance
-   **Logs**: Cek logs melalui console atau sistem monitoring cloud Anda.
-   **Database**: Jalankan `npx drizzle-kit studio` di folder backend untuk GUI manajemen data.

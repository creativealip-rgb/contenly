# Cara Menghubungkan Frontend Vercel ke Backend Localhost

Secara default, **Frontend** Anda yang ada di Vercel (Cloud/Internet) tidak bisa melihat **Backend** yang berjalan di laptop Anda (`localhost`), karena laptop Anda berada di jaringan privat.

Solusinya adalah menggunakan **Tunneling** (seperti Ngrok) untuk membuat backend Anda bisa diakses dari internet.

### Langkah 1: Setup Ngrok (Tunneling)

1.  **Download & Install Ngrok**:
    *   Jika belum ada, download di [ngrok.com](https://ngrok.com/download).
    *   Atau jika menggunakan npm: `npx ngrok http 3001`.

2.  **Jalankan Ngrok**:
    Buka terminal baru di laptop Anda (jangan matikan backend), dan jalankan:
    ```bash
    ngrok http 3001
    ```
    *(Asumsi backend berjalan di port 3001)*.

3.  **Copy URL Public**:
    Ngrok akan menampilkan URL seperti: `https://abcd-123-456.ngrok-free.app`. Copy URL ini.

### Langkah 2: Update Config Frontend (di Vercel)

Anda perlu memberitahu Frontend Vercel kemana harus menghubungi backend.

1.  Buka Dashboard Vercel -> Project Anda -> **Settings**.
2.  Pilih menu **Environment Variables**.
3.  Tambahkan variable baru:
    *   **Key**: `NEXT_PUBLIC_API_URL`
    *   **Value**: URL Ngrok tadi (contoh: `https://abcd-123-456.ngrok-free.app`)
4.  **Redeploy** (Penting):
    *   Pergi ke tab **Deployments**, klik titik tiga pada deployment terakhir, dan pilih **Redeploy**.
    *   *Catatan: Environment variable baru biasanya butuh redeploy agar terbaca.*

### Langkah 3: Update Config Backend (di Local)

Backend Anda juga perlu tahu siapa yang boleh mengaksesnya (CORS Policy).

1.  Buka file `backend/.env` di editor Anda.
2.  Ubah `FRONTEND_URL` menjadi URL Vercel Anda:
    ```env
    FRONTEND_URL=https://nama-project-anda.vercel.app
    ```
    *Atau jika hanya untuk testing sementara, Anda bisa mengubahnya sementara di `main.ts` menjadi bintang `*` (tidak disarankan untuk production).*
3.  Restart backend local Anda (`Ctrl+C` lalu `npm run start:dev`).

### Selesai!

Sekarang Frontend Vercel Anda akan request ke -> Ngrok -> Laptop Anda.
**Note**: URL Ngrok versi gratis akan berubah setiap kali Anda restart ngrok. Jadi setiap kali mau coding, Anda perlu update env var di Vercel lagi (agak repot).

**Solusi Jangka Panjang:**
Sebaiknya deploy Backend Anda ke layanan cloud seperti **Railway**, **Render**, atau **DigitalOcean** agar punya URL tetap dan tidak bergantung pada laptop Anda yang menyala.

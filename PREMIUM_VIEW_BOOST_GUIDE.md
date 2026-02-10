# Panduan Premium View Boost & VPS Deployment

Fitur View Boost sekarang sudah mendukung mode **Premium** yang dioptimalkan untuk Google Analytics dan efisiensi bandwidth.

## 1. Fitur Utama
- **Google Analytics Support**: Menggunakan browser asli (headless) sehingga view terdeteksi sebagai visitor nyata.
- **Bandwidth Saving**: Otomatis memblokir gambar, iklan, dan font untuk menghemat kuota proxy hingga 80%.
- **Human Simulation**: Simulasi scrolling dan waktu tunggu acak agar tidak terdeteksi sebagai bot.

## 2. Cara Menjalankan di VPS (Docker)
Jika Anda menggunakan Docker, saya sudah mengupdate `Dockerfile` agar otomatis menginstall **Chromium**. Anda tidak perlu melakukan pengaturan tambahan di sisi server.

**Langkah Deploy:**
1. Bangun ulang image docker Anda:
   ```bash
   docker build -t contenly-backend -f backend/Dockerfile .
   ```
2. Jalankan container seperti biasa.

## 3. Cara Penggunaan UI
1. Buka dashboard **View Boost**.
2. Pilih **Service Type: Premium**.
3. (Opsional) Masukkan list proxy Anda di kolom yang muncul.
4. Klik **Create Job**.

---
*File ini dibuat secara otomatis sebagai pengganti walkthrough sistem.*

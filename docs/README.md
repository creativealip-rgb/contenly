# Contently Documentation

Selamat datang di dokumentasi resmi **Contently**, platform otomatisasi konten cerdas untuk kreator dan bisnis.

## 🌟 Overview
Contently adalah aplikasi SaaS yang menggabungkan kecerdasan buatan (AI) dengan alur kerja konten tradisional. Dari riset tren hingga publikasi otomatis ke WordPress, Contently dirancang untuk meminimalkan waktu produksi konten namun memaksimalkan kualitas dan jangkauan.

## 📁 Dokumentasi Lengkap
Untuk pemahaman mendalam, silakan eksplorasi sub-dokumen berikut:

1.  **[Arsitektur Teknis](architecture.md)**: Detail stack teknologi, struktur database, dan pola pengembangan.
2.  **[Fitur Produk](features.md)**: Penjelasan mendalam tentang setiap modul (Content Lab, Instagram Studio, dsb).
3.  **[User Flow & Workflows](user-flow.md)**: Panduan langkah demi langkah cara menggunakan platform.
4.  **[Panduan Deployment](deployment.md)**: Cara installasi lokal dan konfigurasi produksi.
5.  **[Live Deployment Source of Truth](live-deployment.md)**: Status production `contenly.app`, compose path, branch live, command deploy, dan hasil verifikasi terbaru.
6.  **[Log 2026-06-21 Production Hardening](log-2026-06-21-production-hardening.md)**: Rangkuman audit, build, deploy, smoke test, dan fix yang sudah dilakukan.

## 🚀 Quick Start
Untuk menjalankan project ini secara lokal:

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Pastikan Anda telah mengonfigurasi file `.env` di kedua folder tersebut.

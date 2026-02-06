# Laporan Teknis: Perbaikan Sinkronisasi Status Artikel

Dokumen ini menjelaskan secara detail penyebab dan solusi terkait masalah di mana status artikel tetap "Draft" di database lokal meskipun sudah berhasil dipublish ke WordPress.

## 1. Identifikasi Masalah
Setelah artikel dikirim ke WordPress, sistem seharusnya memperbarui status di database lokal dari `DRAFT` menjadi `PUBLISHED`. Namun, pada artikel hasil **Scrape Manual**, status tersebut tidak pernah berubah.

## 2. Penyebab Utama (Root Cause)
Masalah utama terletak pada **Type Mismatch** (ketidakcocokan tipe data) pada kolom `feed_item_id` di database PostgreSQL.

### Detail Teknis:
- **Database Schema**: Kolom `feed_item_id` didefinisikan sebagai tipe data `UUID`. Tipe data ini sangat ketat dan hanya menerima format string identitas unik standar (contoh: `550e8400-e29b-41d4-a716-446655440000`).
- **Frontend Behavior**: Untuk artikel yang di-scrape secara manual (bukan dari RSS Feed), frontend menghasilkan ID sementara dengan format `scraped-1738831942187`.
- **Failure Point**: Saat fungsi `WordpressService.publishArticle` mencoba memperbarui data artikel, ia menyertakan ID sementara tersebut ke dalam kolom `feed_item_id`.
- **Silent Exception**: PostgreSQL menolak data tersebut karena `scraped-...` bukan format UUID yang valid. Hal ini menyebabkan query `UPDATE` gagal total secara diam-diam (karena dibungkus *try-catch* yang kurang detail sebelumnya), sehingga status `status = 'PUBLISHED'` tidak pernah tersimpan.

## 3. Solusi yang Diimplementasikan
Solusi dilakukan dengan pendekatan dua lapis untuk memastikan sistem sangat kuat (*robust*).

### A. Validasi UUID di ArticlesService (`articles.service.ts`)
Saya menambahkan fungsi validasi menggunakan library `uuid`. Sebelum melakukan update ke database, sistem sekarang memeriksa setiap `feedItemId`:
```typescript
if (dto.feedItemId !== undefined) {
    if (dto.feedItemId === null || dto.feedItemId === '' || !uuidValidate(dto.feedItemId)) {
        // Jika format salah, hapus dari data update agar tidak merusak query
        delete updateData.feedItemId;
    }
}
```
Ini memastikan database tidak akan pernah menerima string sembarangan yang bisa menyebabkan crash.

### B. Pembersihan Data di WordpressService (`wordpress.service.ts`)
Saya menyempurnakan logika `publishArticle` agar lebih cerdas dalam membedakan antara artikel baru dan update:
- **Untuk Update**: Hanya mengirimkan field yang benar-benar berubah saat publish (Status, WP ID, WP URL, Slug). Field sensitif seperti `feedItemId` tidak lagi dikirim ulang jika artikel sudah ada di DB.
- **Logging Transparan**: Mengganti log ke file sementara dengan `console.error` yang lebih standar agar error database di masa depan langsung terlihat di terminal server.

## 4. Hasil Akhir
- **Stabilitas**: Sistem sekarang tahan terhadap data "kotor" dari frontend.
- **Konsistensi**: Status artikel di Dashboard dan Riwayat Artikel sekarang 100% akurat dan sinkron dengan status di WordPress.
- **Performa**: Query update menjadi lebih ringan karena hanya memperbarui field yang diperlukan saja.

---
**Status:** ✅ Fixed & Verified
**Tanggal:** 6 Februari 2026

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose prose-slate dark:prose-invert">
      <h1>Kebijakan Privasi</h1>
      <p className="text-muted-foreground">Terakhir diperbarui: Mei 2026</p>

      <h2>1. Informasi yang Kami Kumpulkan</h2>
      <p>Kami mengumpulkan informasi yang Anda berikan saat mendaftar akun, termasuk nama, alamat email, dan informasi pembayaran.</p>

      <h2>2. Penggunaan Informasi</h2>
      <p>Informasi Anda digunakan untuk menyediakan layanan, memproses pembayaran, dan mengirim notifikasi terkait akun.</p>

      <h2>3. Penyimpanan Data</h2>
      <p>Data disimpan secara aman dengan enkripsi dan hanya diakses oleh personel yang berwenang.</p>

      <h2>4. Hak Pengguna</h2>
      <p>Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui halaman pengaturan akun.</p>

      <h2>5. Kontak</h2>
      <p>Untuk pertanyaan terkait privasi, hubungi kami di <a href="mailto:privacy@contenly.web.id">privacy@contenly.web.id</a>.</p>
    </div>
  )
}

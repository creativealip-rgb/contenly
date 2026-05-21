import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose prose-slate dark:prose-invert">
      <h1>Syarat & Ketentuan</h1>
      <p className="text-muted-foreground">Terakhir diperbarui: Mei 2026</p>

      <h2>1. Penerimaan Syarat</h2>
      <p>Dengan menggunakan Contenly, Anda menyetujui syarat dan ketentuan yang berlaku.</p>

      <h2>2. Penggunaan Layanan</h2>
      <p>Layanan ini ditujukan untuk pembuatan konten yang sah. Dilarang menggunakan platform untuk konten ilegal, spam, atau pelanggaran hak cipta.</p>

      <h2>3. Akun & Keamanan</h2>
      <p>Anda bertanggung jawab menjaga keamanan akun dan password Anda.</p>

      <h2>4. Token & Pembayaran</h2>
      <p>Token yang dibeli bersifat non-refundable. Penggunaan token mengikuti tarif yang berlaku pada saat transaksi.</p>

      <h2>5. Batasan Tanggung Jawab</h2>
      <p>Contenly tidak bertanggung jawab atas kerugian yang timbul dari penggunaan konten yang dihasilkan oleh AI.</p>

      <h2>6. Perubahan Syarat</h2>
      <p>Kami berhak mengubah syarat ini kapan saja. Perubahan akan dinotifikasi melalui email atau in-app notification.</p>
    </div>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl text-muted-foreground">Halaman tidak ditemukan</p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}

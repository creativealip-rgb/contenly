'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Terjadi Kesalahan</h1>
          <p style={{ color: '#666' }}>Maaf, terjadi kesalahan yang tidak terduga.</p>
          <button
            onClick={reset}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#fff', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  )
}

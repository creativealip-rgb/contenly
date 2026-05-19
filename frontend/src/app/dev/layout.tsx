/**
 * Dev sandbox layout — tidak ada AuthGuard, tidak ada sidebar.
 * Hanya untuk testing fitur secara terisolasi.
 *
 * Aktifkan dengan env NEXT_PUBLIC_DEV_BYPASS=1 supaya banner muncul.
 * Backend harus di-set DEV_BYPASS_AUTH=1 agar API calls lulus tanpa login.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-bold uppercase tracking-wider text-amber-900">
        🚧 Dev Sandbox — Auth bypassed. Pastikan backend `DEV_BYPASS_AUTH=1` aktif.
      </div>
      <main className="px-4 py-6 md:px-8">{children}</main>
    </div>
  )
}

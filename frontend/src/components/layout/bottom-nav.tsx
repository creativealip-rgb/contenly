'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores'

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="9" rx="2" />
        <rect x="14" y="3" width="7" height="5" rx="2" />
        <rect x="14" y="12" width="7" height="9" rx="2" />
        <rect x="3" y="16" width="7" height="5" rx="2" />
      </svg>
    ),
  },
  {
    href: '/content-lab',
    label: 'Lab',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 3h6v4H9zM5 7h14v4H5zM7 11h10v10H7z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 15h4M10 18h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/trend-radar',
    label: 'Radar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v9l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/articles',
    label: 'Artikel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 8h8M8 12h8M8 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { toggle } = useSidebarStore()

  // Hide bottom nav on login/register pages and landing page
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/'
  if (isAuthPage) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all duration-200",
                isActive
                  ? "text-blue-600"
                  : "text-muted-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "transition-all duration-200",
                isActive && "scale-110 -translate-y-0.5"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-colors duration-200",
                isActive ? "text-blue-600" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-6 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          )
        })}

        {/* More button - opens sidebar */}
        <button
          onClick={toggle}
          className="flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl text-muted-foreground active:scale-95 transition-all duration-200"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="6" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-[10px] font-semibold">Lainnya</span>
        </button>
      </div>
    </nav>
  )
}

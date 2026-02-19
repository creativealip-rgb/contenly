'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'

// Icons using Lucide for consistency
import { 
  LayoutDashboard, 
  FlaskConical, 
  FileText, 
  Plug, 
  CreditCard 
} from 'lucide-react'

const navItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard 
  },
  { 
    href: '/content-lab', 
    label: 'Lab', 
    icon: FlaskConical 
  },
  { 
    href: '/articles', 
    label: 'Articles', 
    icon: FileText 
  },
  { 
    href: '/integrations', 
    label: 'Connect', 
    icon: Plug 
  },
  { 
    href: '/billing', 
    label: 'Billing', 
    icon: CreditCard 
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  // Hide bottom nav on login/register pages and landing page
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/'
  if (isAuthPage) return null

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bottom-nav md:hidden"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "bottom-nav-item relative",
                isActive && "active"
              )}
            >
              <motion.div
                className="relative flex flex-col items-center gap-1"
                whileTap={{ scale: 0.9 }}
              >
                {/* Icon */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      isActive ? "text-[var(--brand-primary)]" : "text-muted-foreground"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-[var(--brand-primary)]" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>

                {/* Active Indicator Pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1 w-8 h-1 bg-[var(--brand-primary)] rounded-full"
                    style={{
                      boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}

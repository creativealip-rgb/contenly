import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlaskConical, TrendingUp, Instagram, Video, ArrowRight } from 'lucide-react'

const quickActions = [
    {
        label: 'Content Lab',
        description: 'Buat artikel AI berkualitas',
        href: '/content-lab',
        icon: FlaskConical,
        gradient: 'from-blue-600 to-blue-400',
        delay: 0,
    },
    {
        label: 'Trend Radar',
        description: 'Temukan topik viral global',
        href: '/trend-radar',
        icon: TrendingUp,
        gradient: 'from-amber-500 to-orange-500',
        delay: 1,
    },
    {
        label: 'Instagram Studio',
        description: 'Buat carousel Instagram AI',
        href: '/instagram-studio',
        icon: Instagram,
        gradient: 'from-pink-500 to-rose-500',
        delay: 2,
    },
    {
        label: 'Script Studio',
        description: 'Buat script video pendek',
        href: '/video-scripts',
        icon: Video,
        gradient: 'from-purple-500 to-indigo-500',
        delay: 3,
    },
]

interface QuickActionsProps {
    isLoading?: boolean
}

export function QuickActions({ isLoading }: QuickActionsProps) {
    return (
        <Card variant="glass" className="overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Aksi Cepat
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-3 sm:px-6 pb-6">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse bg-muted/5">
                            <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-muted shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 rounded bg-muted" />
                                <div className="h-2 w-2/3 rounded bg-muted" />
                            </div>
                            <div className="h-4 w-4 rounded bg-muted shrink-0" />
                        </div>
                    ))
                ) : (
                    quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                            <motion.div
                                key={action.href}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    delay: action.delay * 0.1 + 0.3,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 15
                                }}
                            >
                                <Link href={action.href} className="block min-w-0">
                                    <Button
                                        variant="outline"
                                        animate={false}
                                        className="group w-full h-auto p-3 hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-200 rounded-xl overflow-hidden border-white/40 dark:border-white/10"
                                    >
                                        <motion.div
                                            className="flex items-center gap-3 w-full min-w-0"
                                            whileHover={{ x: 4 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        >
                                            <motion.div
                                                className={`flex-shrink-0 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg`}
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </motion.div>
                                            <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                                                <div className="text-left min-w-0">
                                                    <div className="font-semibold truncate text-xs md:text-sm">{action.label}</div>
                                                    <div className="text-[10px] md:text-xs text-muted-foreground truncate opacity-80">{action.description}</div>
                                                </div>
                                                <motion.div
                                                    className="flex-shrink-0 text-muted-foreground/50 group-hover:text-[var(--brand-primary)] transition-colors"
                                                    initial={{ x: 0 }}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    </Button>
                                </Link>
                            </motion.div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}

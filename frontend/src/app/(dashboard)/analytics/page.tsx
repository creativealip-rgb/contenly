'use client'

import dynamic from 'next/dynamic'

const AnalyticsContent = dynamic(() => import('./analytics-content'), {
    ssr: false,
    loading: () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="h-8 w-40 bg-muted animate-pulse rounded" />
                <div className="h-10 w-44 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-72 bg-muted animate-pulse rounded-xl" />
                <div className="h-72 bg-muted animate-pulse rounded-xl" />
            </div>
        </div>
    ),
})

export default function AnalyticsPage() {
    return <AnalyticsContent />
}

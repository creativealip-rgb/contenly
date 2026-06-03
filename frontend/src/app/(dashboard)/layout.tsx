import { DashboardLayout } from '@/components/layout'
import { AuthGuard } from '@/components/guards'

export default function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <DashboardLayout>{children}</DashboardLayout>
        </AuthGuard>
    )
}

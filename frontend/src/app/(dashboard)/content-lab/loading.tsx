import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[70vh] rounded-xl" />
        <Skeleton className="h-[70vh] rounded-xl" />
        <Skeleton className="h-[70vh] rounded-xl" />
      </div>
    </div>
  )
}

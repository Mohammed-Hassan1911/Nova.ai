import { Skeleton } from '@/components/ui/Skeleton'

function CardGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-24" />
          <Skeleton className="mt-4 h-1.5 w-full" />
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableRows() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="ml-auto h-9 w-28 rounded-[10px]" />
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="ml-auto h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function Dashboard() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 flex h-40 items-end gap-2">
            {['h-16', 'h-24', 'h-12', 'h-32', 'h-20', 'h-36', 'h-14', 'h-28', 'h-20', 'h-32', 'h-24', 'h-16'].map((h, i) => (
              <Skeleton key={i} className={`flex-1 rounded-t ${h}`} />
            ))}
          </div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <Skeleton className="h-4 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="mt-1.5 h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Chat() {
  return (
    <div className="flex gap-4">
      <div className="hidden w-64 shrink-0 lg:block">
        <Skeleton className="h-10 w-full rounded-[10px]" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-[8px]" />
          ))}
        </div>
      </div>
      <div className="flex-1 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-12 w-3/4 rounded-[10px]" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-[10px]" />
          <Skeleton className="h-12 w-2/3 rounded-[10px]" />
        </div>
      </div>
    </div>
  )
}

function Detail() {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-3.5 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-[10px]" />
      </div>
      <div className="mt-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-48 w-full rounded-[var(--radius-card)]" />
      </div>
    </div>
  )
}

export function PageSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'table' | 'dashboard' | 'chat' | 'detail' }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
      </div>
      <div className="mt-6">
        {variant === 'grid' && <CardGrid />}
        {variant === 'table' && <TableRows />}
        {variant === 'dashboard' && <Dashboard />}
        {variant === 'chat' && <Chat />}
        {variant === 'detail' && <Detail />}
      </div>
    </div>
  )
}

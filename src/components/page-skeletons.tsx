import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

function DashboardPageHeaderSkeleton() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-4 w-28" />
      </div>
    </header>
  )
}

export function DashboardTableSkeleton({
  columns = 5,
  rows = 6,
}: {
  columns?: number
  rows?: number
}) {
  return (
    <>
      <DashboardPageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="border border-border">
          <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
            {Array.from({ length: columns }, (_, i) => (
              <Skeleton className="h-4 flex-1" key={i} />
            ))}
          </div>
          {Array.from({ length: rows }, (_, row) => (
            <div
              className="flex gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
              key={row}
            >
              {Array.from({ length: columns }, (_, col) => (
                <Skeleton
                  className={cn('h-4 flex-1', col === 0 && 'max-w-[40%]')}
                  key={col}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function DashboardDetailSkeleton() {
  return (
    <>
      <DashboardPageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-3/4 max-w-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div className="border border-border px-4 py-3" key={i}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-5 w-32" />
            </div>
          ))}
        </div>
        <div className="border border-border">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
              key={i}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function DashboardFormSkeleton() {
  return (
    <>
      <DashboardPageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid max-w-2xl gap-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </>
  )
}

export function EventsListSkeleton() {
  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-56" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mb-6 flex gap-1 border-b border-border pb-px">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-20" />
      </div>
      <ul className="divide-y divide-border border-b border-border">
        {Array.from({ length: 5 }, (_, i) => (
          <li className="flex items-center gap-4 py-3.5 sm:gap-5" key={i}>
            <Skeleton className="size-14 shrink-0 sm:size-16" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-48 max-w-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="h-4 w-16" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function EventDetailSkeleton() {
  return (
    <article>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:px-12 lg:py-12">
        <div>
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="mt-6 h-10 w-3/4 max-w-md" />
          <div className="mt-5 flex gap-3 border-b border-border pb-2.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div className="space-y-2" key={i}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
        <aside className="space-y-4 border border-border p-5 sm:p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-10 w-full" />
        </aside>
      </div>
    </article>
  )
}

export function ShopCatalogSkeleton() {
  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 space-y-2 sm:mb-10">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-10 w-36" />
      </div>
      <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            <Skeleton className="aspect-[3/4] w-full rounded-none" />
            <Skeleton className="mt-3 h-4 w-40" />
            <Skeleton className="mt-1.5 h-4 w-20" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ShopProductSkeleton() {
  return (
    <article>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-12 lg:py-12">
        <div className="max-w-md">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <div className="mt-2 flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton className="size-16 shrink-0 sm:size-[4.5rem]" key={i} />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton className="h-9 w-12" key={i} />
            ))}
          </div>
          <Skeleton className="mt-4 h-10 w-full max-w-xs" />
        </aside>
      </div>
    </article>
  )
}

export function AccountPageSkeleton() {
  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 space-y-2 sm:mb-10">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-56 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="lg:grid lg:grid-cols-[12.5rem_minmax(0,52rem)] lg:items-start lg:gap-12 xl:gap-16">
        <div className="mb-8 flex gap-1 border-b border-border lg:mb-0 lg:flex-col lg:border-b-0">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton className="h-9 w-24 lg:w-full" key={i} />
          ))}
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AccountOrdersSkeleton({
  showHeading = true,
}: {
  showHeading?: boolean
}) {
  return (
    <div>
      {showHeading ? <Skeleton className="h-6 w-36" /> : null}
      <ul
        className={
          showHeading
            ? 'mt-6 divide-y divide-border border-y border-border'
            : 'divide-y divide-border border-y border-border'
        }
      >
        {Array.from({ length: 4 }, (_, i) => (
          <li className="flex items-center justify-between gap-4 py-4" key={i}>
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CartLinesSkeleton({ className }: { className?: string }) {
  return (
    <ul className={cn('divide-y divide-border', className)}>
      {Array.from({ length: 3 }, (_, i) => (
        <li className="flex gap-3 py-4" key={i}>
          <Skeleton className="size-20 shrink-0 rounded-none sm:size-24" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-4 w-16" />
        </li>
      ))}
    </ul>
  )
}

export function RegisterWizardSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10 lg:px-0 lg:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-56 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton className="h-2 flex-1" key={i} />
        ))}
      </div>
      <div className="space-y-5">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="space-y-2" key={i}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <Skeleton className="h-8 w-40" />
        <div className="mt-8 space-y-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full max-w-xs" />
        </div>
      </div>
      <aside className="hidden border-l border-border bg-neutral-100 px-8 py-12 lg:block">
        <Skeleton className="h-6 w-36" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div className="flex gap-3" key={i}>
              <Skeleton className="size-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mt-8 h-6 w-full" />
      </aside>
    </div>
  )
}

export function PublicPageSkeleton() {
  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 space-y-2 sm:mb-10">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton className="h-16 w-full" key={i} />
        ))}
      </div>
    </section>
  )
}

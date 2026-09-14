import { Link, createFileRoute } from '@tanstack/react-router'
import { formatPickupAddress } from '~/data/pickup-points'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { buttonVariants } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { listPickupPoints } from '~/lib/pickup-point.functions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/dashboard/pickup-points/')({
  loader: () => listPickupPoints({ data: { includeInactive: true } }),
  component: DashboardPickupPointsPage,
})

function DashboardPickupPointsPage() {
  const points = Route.useLoaderData()

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Pickup Points</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Pickup Points
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {points.length} locations · Later, customers can collect kit here
              instead of shipping
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ size: 'sm' }))}
            to="/dashboard/pickup-points/new"
          >
            Add pickup point
          </Link>
        </div>

        {points.length === 0 ? (
          <p className="border border-border px-4 py-10 text-sm text-muted-foreground">
            No pickup points yet. Add a location customers can collect kit from.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {points.map((point) => (
              <li key={point.id}>
                <Link
                  className="flex items-center gap-4 px-4 py-3 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
                  params={{ id: point.id }}
                  to="/dashboard/pickup-points/$id"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{point.name}</p>
                    <p className="mt-0.5 truncate text-muted-foreground">
                      {formatPickupAddress(point)}
                      {point.hours ? (
                        <>
                          <span className="text-border"> · </span>
                          {point.hours}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    {point.active ? 'Active' : 'Hidden'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

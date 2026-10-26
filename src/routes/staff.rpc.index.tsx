import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  CaretRightIcon,
  MapPinIcon,
  TShirtIcon,
} from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { EventStatusBadge } from '~/components/event-status-badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { DashboardTableSkeleton } from '~/components/page-skeletons'
import { listStaffRpcEvents } from '~/lib/rpc.functions'
import { formatEventDateLabel } from '~/lib/event-datetime'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/staff/rpc/')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: () => listStaffRpcEvents(),
  head: () => ({
    meta: seo({
      title: 'Race pack collection · Staff | Barong Cycling Team',
      description:
        'Choose an event, then mark confirmed riders when they collect their kit.',
    }),
  }),
  component: StaffRpcIndexPage,
})

function StaffRpcIndexPage() {
  const events = Route.useLoaderData()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          to="/staff"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Staff tools
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Race pack collection
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose an event, then mark kits as collected.
        </p>
      </div>

      {events.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TShirtIcon />
            </EmptyMedia>
            <EmptyTitle>No events with race pack collection</EmptyTitle>
            <EmptyDescription>
              Turn on jersey size for an event before RPC begins.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.slug}>
              <Link
                className="flex items-start gap-3 rounded-lg border border-border px-4 py-4 transition-colors hover:bg-muted/50"
                params={{ slug: event.slug }}
                to="/staff/rpc/$slug"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium tracking-tight">{event.name}</p>
                    <EventStatusBadge status={event.status} />
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-1.5">
                      <CalendarBlankIcon
                        aria-hidden
                        className="size-3.5 shrink-0"
                      />
                      {formatEventDateLabel(event.eventDate)}
                    </p>
                    {event.locationName ? (
                      <p className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPinIcon
                          aria-hidden
                          className="size-3.5 shrink-0"
                        />
                        <span className="truncate">{event.locationName}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <CaretRightIcon
                  aria-hidden
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

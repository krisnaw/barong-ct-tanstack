import { Link, createFileRoute } from '@tanstack/react-router'
import { events, type EventStatus } from '~/data/events'
import { pastEvents } from '~/data/recaps'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { buttonVariants } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'

const eventStatusStyles: Record<EventStatus, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

const eventStatusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
}

export const Route = createFileRoute('/dashboard/events/')({
  component: DashboardEventsPage,
})

function DashboardEventsPage() {
  return (
    <>
      <DashboardPageHeader title="Events" />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Events
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length + pastEvents.length} total · Live rides and Melali
              recaps
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              to="/events"
            >
              View public
            </Link>
            <Link
              className={cn(buttonVariants({ size: 'sm' }))}
              to="/dashboard/events/new"
            >
              Create event
            </Link>
          </div>
        </div>

        <ul className="divide-y divide-border border border-border">
          {events.map((event) => (
            <li key={event.slug}>
              <Link
                className="flex items-center gap-4 px-4 py-3 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
                params={{ slug: event.slug }}
                to="/dashboard/events/$slug"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{event.name}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">
                    {event.date}
                    <span className="text-border"> · </span>
                    {event.location}
                    <span className="text-border"> · </span>
                    {event.kind}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
                    eventStatusStyles[event.status],
                  )}
                >
                  {eventStatusLabel[event.status]}
                </span>
              </Link>
            </li>
          ))}
          {pastEvents.map((event) => (
            <li key={`recap-${event.slug}`}>
              <Link
                className="flex items-center gap-4 px-4 py-3 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
                params={{ slug: event.slug }}
                to="/recaps/$slug"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{event.name}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">
                    {event.date}
                    <span className="text-border"> · </span>
                    {event.location}
                  </p>
                </div>
                <span className="shrink-0 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Recap
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function DashboardPageHeader({ title }: { title: string }) {
  return (
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
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}

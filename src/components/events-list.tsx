import { Link } from '@tanstack/react-router'
import { type ClubEvent, type EventStatus, eventImageSrc } from '~/data/events'
import { pastEvents } from '~/data/recaps'
import { cn } from '~/lib/utils'

export type EventsTab = 'active' | 'past'

const statusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
}

const statusStyles: Record<EventStatus, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

export function EventsList({
  tab,
  events,
}: {
  tab: EventsTab
  events: ClubEvent[]
}) {
  const isPast = tab === 'past'
  const activeEvents = events.filter((event) => event.status === 'open')
  const count = isPast ? pastEvents.length : activeEvents.length

  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Events
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Ride calendar
          </h1>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          {count} {isPast ? 'past' : 'active'}{' '}
          {count === 1 ? 'event' : 'events'}
          {isPast ? ' · Recaps' : ' · Register for open rides'}
        </p>
      </div>

      <div
        className="mb-6 flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Event filters"
      >
        <TabLink active={tab === 'active'} tab="active">
          Active & upcoming
        </TabLink>
        <TabLink active={tab === 'past'} tab="past">
          Past
        </TabLink>
      </div>

      {isPast ? (
        <PastEventsRows />
      ) : (
        <ActiveEventsRows events={activeEvents} />
      )}
    </section>
  )
}

function TabLink({
  tab,
  active,
  children,
}: {
  tab: EventsTab
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      aria-selected={active}
      className={cn(
        '-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors',
        active
          ? 'border-foreground font-medium text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
      role="tab"
      search={{ tab }}
      to="/events"
    >
      {children}
    </Link>
  )
}

function ActiveEventsRows({ events }: { events: ClubEvent[] }) {
  if (events.length === 0) {
    return <EmptyState message="No active or upcoming events right now." />
  }

  return (
    <ul className="divide-y divide-border border-b border-border">
      {events.map((event) => (
        <li key={event.slug}>
          <Link
            className="group flex items-center gap-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 sm:gap-5 sm:py-3.5"
            params={{ slug: event.slug }}
            to="/events/$slug"
          >
            <img
              alt=""
              className="size-14 shrink-0 object-cover sm:size-16"
              decoding="async"
              height={128}
              src={eventImageSrc(event.image, 128)}
              width={128}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-base font-semibold tracking-tight sm:truncate sm:text-lg">
                  {event.name}
                </h2>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
                    statusStyles[event.status],
                  )}
                >
                  {statusLabel[event.status]}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{event.date}</p>
            </div>

            <dl className="shrink-0 text-right text-sm sm:flex sm:items-center sm:gap-8">
              <div className="hidden sm:block">
                <dt className="sr-only">Distance</dt>
                <dd className="font-medium whitespace-nowrap tabular-nums">
                  {event.distance}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Fee</dt>
                <dd className="whitespace-nowrap text-muted-foreground sm:min-w-[9rem]">
                  {event.fee ?? 'Free'}
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function PastEventsRows() {
  if (pastEvents.length === 0) {
    return <EmptyState message="No past event recaps yet." />
  }

  return (
    <ul className="divide-y divide-border border-b border-border">
      {pastEvents.map((event) => (
        <li key={event.slug}>
          <Link
            className="group flex items-center gap-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 sm:gap-5 sm:py-3.5"
            params={{ slug: event.slug }}
            to="/recaps/$slug"
          >
            <img
              alt=""
              className="size-14 shrink-0 object-cover sm:size-16"
              decoding="async"
              height={128}
              src={`${event.image}&w=128&h=128&q=70`}
              width={128}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-base font-semibold tracking-tight sm:truncate sm:text-lg">
                  {event.name}
                </h2>
                <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] text-zinc-600 uppercase">
                  Recap
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{event.date}</p>
            </div>

            <dl className="shrink-0 text-right text-sm sm:flex sm:items-center sm:gap-8">
              <div className="hidden sm:block">
                <dt className="sr-only">Distance</dt>
                <dd className="font-medium whitespace-nowrap tabular-nums">
                  {event.distance}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Field</dt>
                <dd className="whitespace-nowrap text-muted-foreground">
                  {event.highlight}
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="border-y border-border py-10 text-sm text-muted-foreground">
      {message}
    </p>
  )
}

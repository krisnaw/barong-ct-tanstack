import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { events, type EventStatus } from '~/data/events'

const statusLabel: Record<EventStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  upcoming: 'Soon',
}

export function EventsList() {
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
          {events.length} events · Register for open rides
        </p>
      </div>

      <ul className="divide-y divide-border border-y border-border">
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
                src={`${event.image}&w=128&h=128&q=70`}
                width={128}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h2 className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
                    {event.name}
                  </h2>
                  <span className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    {statusLabel[event.status]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {event.date}
                  <span className="text-border"> · </span>
                  {event.location}
                </p>
              </div>

              <dl className="hidden shrink-0 items-center gap-8 text-sm md:flex">
                <div className="w-24 text-right">
                  <dt className="sr-only">Distance</dt>
                  <dd className="font-medium tabular-nums">{event.distance}</dd>
                </div>
                <div className="w-20 text-right">
                  <dt className="sr-only">Fee</dt>
                  <dd className="truncate text-muted-foreground">
                    {event.fee ?? 'Free'}
                  </dd>
                </div>
              </dl>

              <ArrowUpRightIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                weight="bold"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

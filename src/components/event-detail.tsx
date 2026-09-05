import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  MapPinIcon,
  PathIcon,
  UsersIcon,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type { ClubEvent, EventStatus } from '~/data/events'
import { Button, buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const statusLabel: Record<EventStatus, string> = {
  open: 'Registration open',
  closed: 'Registration closed',
  upcoming: 'Coming soon',
}

export function EventDetail({ event }: { event: ClubEvent }) {
  const canRegister = event.status === 'open'

  return (
    <article>
      <header className="flex items-center justify-between gap-6 border-b border-border px-5 py-5 sm:px-8 lg:px-12">
        <Link
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          to="/"
        >
          <span className="grid size-8 place-items-center rounded-full bg-foreground font-heading text-sm font-semibold tracking-tight text-background">
            B
          </span>
          <span className="font-heading text-sm font-medium tracking-wide uppercase">
            Barong
          </span>
        </Link>
        <Link
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
          )}
          to="/events"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" weight="bold" />
          All events
        </Link>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:px-12 lg:py-12">
        <div>
          <img
            alt={event.imageAlt}
            className="aspect-[16/10] w-full object-cover"
            decoding="async"
            height={800}
            src={`${event.image}&w=1200&q=75`}
            width={1200}
          />

          <p className="mt-6 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {statusLabel[event.status]}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {event.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {event.description}
          </p>

          <dl className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
            <Fact
              icon={<CalendarBlankIcon className="size-4" weight="bold" />}
              label="When"
              value={`${event.date} · ${event.time}`}
            />
            <Fact
              icon={<MapPinIcon className="size-4" weight="bold" />}
              label="Start"
              value={event.location}
            />
            <Fact
              icon={<PathIcon className="size-4" weight="bold" />}
              label="Distance"
              value={
                event.elevation
                  ? `${event.distance} · ${event.elevation}`
                  : event.distance
              }
            />
            {event.capacity ? (
              <Fact
                icon={<UsersIcon className="size-4" weight="bold" />}
                label="Field"
                value={
                  event.registered
                    ? `${event.registered} / ${event.capacity} riders`
                    : `${event.capacity} spots`
                }
              />
            ) : null}
          </dl>
        </div>

        <aside className="h-fit border border-border p-5 sm:p-6 lg:sticky lg:top-6">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Entry
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">
            {event.fee ?? 'Free'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{event.blurb}</p>

          <Button className="mt-6 w-full" disabled={!canRegister} type="button">
            {canRegister
              ? 'Register'
              : event.status === 'upcoming'
                ? 'Registration opens soon'
                : 'Registration closed'}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {canRegister
              ? 'You will sign in before completing registration.'
              : 'Check back later or browse other open events.'}
          </p>
        </aside>
      </div>
    </article>
  )
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <dt className="text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="mt-1 text-sm font-medium">{value}</dd>
      </div>
    </div>
  )
}

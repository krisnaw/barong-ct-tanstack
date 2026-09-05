import {
  CalendarBlankIcon,
  MapPinIcon,
  PathIcon,
  UsersIcon,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type { ClubEvent, EventStatus } from '~/data/events'
import { buttonVariants } from '~/components/ui/button'
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

          {canRegister ? (
            <Link
              className={cn(buttonVariants(), 'mt-6 w-full')}
              params={{ slug: event.slug }}
              search={{
                step: event.registration === 'full' ? 'jersey' : 'profile',
              }}
              to="/events/$slug/register"
            >
              Register
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants(),
                'mt-6 w-full opacity-50 pointer-events-none',
              )}
            >
              {event.status === 'upcoming'
                ? 'Registration opens soon'
                : 'Registration closed'}
            </span>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {canRegister
              ? event.registration === 'full'
                ? 'Next: jersey, route, profile, then payment.'
                : 'Confirm your details to join the ride.'
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

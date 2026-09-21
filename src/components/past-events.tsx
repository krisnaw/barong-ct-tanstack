import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { type ClubEvent, eventImageSrc } from '~/data/events'
import { useTranslations } from '~/lib/i18n'
import { cn } from '~/lib/utils'

function eventYear(event: ClubEvent) {
  if (event.eventDate) {
    const year = Number(event.eventDate.slice(0, 4))
    if (!Number.isNaN(year)) return String(year)
  }
  const match = event.date.match(/\b(20\d{2})\b/)
  return match?.[1] ?? ''
}

export function PastEvents({ events }: { events: ClubEvent[] }) {
  const t = useTranslations()
  const featuredSlug = events[0]?.slug

  return (
    <section
      className="bg-background px-5 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      id="events"
    >
      <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.22em] text-foreground uppercase">
            <span aria-hidden className="h-px w-8 bg-primary" />
            {t.events.eyebrow}
          </p>
          <h2 className="mt-4 font-heading text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
            {t.events.title}
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.events.body}
        </p>
      </div>

      {events.length === 0 ? (
        <p className="border-y border-border py-10 text-sm text-muted-foreground">
          No past events yet.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-5 lg:gap-5">
          {events.map((event) => {
            const featured = event.slug === featuredSlug
            return (
              <li
                className={featured ? 'lg:col-span-3' : 'lg:col-span-2'}
                key={event.slug}
              >
                <EventCard event={event} featured={featured} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function EventCard({
  event,
  featured,
}: {
  event: ClubEvent
  featured: boolean
}) {
  const t = useTranslations()
  const year = eventYear(event)
  const highlight = event.capacity
    ? `${event.capacity} riders`
    : (event.fee ?? 'Free')

  return (
    <Link
      className={cn(
        'group relative flex min-h-[28rem] flex-col justify-end overflow-hidden rounded-none bg-foreground text-white outline-none',
        'ring-offset-background transition-[transform,box-shadow] duration-300',
        'hover:shadow-lg focus-visible:ring-3 focus-visible:ring-primary/70',
        'motion-reduce:transition-none',
      )}
      params={{ slug: event.slug }}
      to="/events/$slug"
    >
      <img
        alt={event.imageAlt}
        className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        decoding="async"
        height={1200}
        sizes={
          featured
            ? '(min-width: 1024px) 60vw, 100vw'
            : '(min-width: 1024px) 40vw, 100vw'
        }
        src={eventImageSrc(event.image, 1200)}
        srcSet={`${eventImageSrc(event.image, 800)} 800w, ${eventImageSrc(event.image, 1200)} 1200w, ${eventImageSrc(event.image, 1800)} 1800w`}
        width={1800}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/55 to-foreground/15" />

      {year ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-4 right-4 font-heading text-[clamp(4.5rem,12vw,8rem)] leading-none font-semibold tracking-[-0.08em] text-white/15"
        >
          {year}
        </span>
      ) : null}

      <div className="relative z-10 flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {featured ? (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.65rem] font-medium tracking-[0.16em] text-foreground uppercase">
              {t.events.latest}
            </span>
          ) : null}
          <span className="text-[0.65rem] font-medium tracking-[0.2em] text-white/70 uppercase">
            {event.date}
          </span>
        </div>

        <div>
          <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {event.name}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
            {event.blurb}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[0.65rem] tracking-[0.16em] text-white/50 uppercase">
              {t.events.distance}
            </dt>
            <dd className="mt-1 font-heading font-medium">{event.distance}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] tracking-[0.16em] text-white/50 uppercase">
              {t.events.start}
            </dt>
            <dd className="mt-1 font-heading font-medium">{event.location}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[0.65rem] tracking-[0.16em] text-white/50 uppercase">
              {t.events.field}
            </dt>
            <dd className="mt-1 font-heading font-medium">{highlight}</dd>
          </div>
        </dl>

        <p className="flex items-center gap-1.5 text-sm font-medium text-white">
          {t.events.viewRecap}
          <ArrowUpRightIcon
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
            weight="bold"
          />
        </p>
      </div>
    </Link>
  )
}

import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { pastEvents, type PastEvent } from '~/data/events'
import { cn } from '~/lib/utils'

export function PastEvents() {
  return (
    <section
      className="bg-background px-5 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      id="events"
    >
      <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.22em] text-primary uppercase">
            <span aria-hidden className="h-px w-8 bg-primary" />
            Melali
          </p>
          <h2 className="mt-4 font-heading text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
            Two years of wandering Bali by bike.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          Barong Melali is the club’s annual jalan-jalan — not a race. Same
          start at UC Batubulan, a new map each year.
        </p>
      </div>

      <ul className="grid gap-4 lg:grid-cols-5 lg:gap-5">
        {pastEvents.map((event) => (
          <li
            className={event.featured ? 'lg:col-span-3' : 'lg:col-span-2'}
            key={event.slug}
          >
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function EventCard({ event }: { event: PastEvent }) {
  return (
    <Link
      className={cn(
        'group relative flex min-h-[28rem] flex-col justify-end overflow-hidden rounded-2xl bg-foreground text-white outline-none',
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
        sizes={event.featured ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 40vw, 100vw'}
        src={`${event.image}&w=1200&q=75`}
        srcSet={`${event.image}&w=800&q=70 800w, ${event.image}&w=1200&q=75 1200w, ${event.image}&w=1800&q=80 1800w`}
        width={1800}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/55 to-foreground/15" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/35 to-transparent" />

      <span
        aria-hidden
        className="pointer-events-none absolute top-4 right-4 font-heading text-[clamp(4.5rem,12vw,8rem)] leading-none font-semibold tracking-[-0.08em] text-white/15"
      >
        {event.year}
      </span>

      <div className="relative z-10 flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {event.featured ? (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.16em] text-primary-foreground uppercase">
              Latest
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
            <dt className="text-[0.65rem] tracking-[0.16em] text-primary uppercase">
              Distance
            </dt>
            <dd className="mt-1 font-heading font-medium">{event.distance}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] tracking-[0.16em] text-primary uppercase">
              Start
            </dt>
            <dd className="mt-1 font-heading font-medium">{event.location}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[0.65rem] tracking-[0.16em] text-primary uppercase">
              Field
            </dt>
            <dd className="mt-1 font-heading font-medium">{event.highlight}</dd>
          </div>
        </dl>

        <p className="flex items-center gap-1.5 text-sm font-medium text-white">
          View recap
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

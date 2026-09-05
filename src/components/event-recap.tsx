import { ArrowLeftIcon, MapPinIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type { PastEvent } from '~/data/events'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export function EventRecap({ event }: { event: PastEvent }) {
  return (
    <article>
      <EventHero event={event} />
      <EventStats event={event} />
      <EventPhotos event={event} />
      <EventTestimonials event={event} />
    </article>
  )
}

function EventHero({ event }: { event: PastEvent }) {
  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden bg-foreground text-white lg:min-h-[80vh]">
      <img
        alt={event.imageAlt}
        className="absolute inset-0 size-full object-cover"
        decoding="async"
        fetchPriority="high"
        height={1600}
        sizes="100vw"
        src={`${event.image}&w=1600&q=75`}
        srcSet={`${event.image}&w=800&q=70 800w, ${event.image}&w=1600&q=75 1600w, ${event.image}&w=2400&q=80 2400w`}
        width={2400}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/65 to-foreground/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-foreground/40" />

      <div className="relative z-10 flex min-h-[70vh] flex-col lg:min-h-[80vh]">
        <div className="flex items-center justify-between gap-4 px-5 pt-6 sm:px-8 lg:px-12">
          <Link
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-white text-foreground hover:bg-white/90',
            )}
            hash="events"
            to="/"
          >
            <ArrowLeftIcon aria-hidden className="size-3.5" weight="bold" />
            All events
          </Link>
          <p className="text-xs font-medium tracking-[0.22em] text-white/60 uppercase">
            Event recap
          </p>
        </div>

        <div className="mt-auto px-5 pb-10 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium tracking-[0.2em] text-white/70 uppercase sm:text-sm">
            <span>{event.date}</span>
            <span className="text-white/35">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon aria-hidden className="size-3.5" weight="bold" />
              {event.location}
            </span>
          </p>

          <h1 className="mt-5 max-w-4xl font-heading text-[clamp(2.75rem,8vw,6rem)] leading-[0.9] font-semibold tracking-[-0.05em]">
            {event.name}
          </h1>

          <span aria-hidden className="mt-5 block h-px w-16 bg-white" />

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            {event.summary}
          </p>
        </div>
      </div>
    </section>
  )
}

function EventStats({ event }: { event: PastEvent }) {
  return (
    <section className="bg-background px-5 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.22em] uppercase">
            <span aria-hidden className="h-px w-8 bg-foreground" />
            By the numbers
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.75rem,4vw,2.75rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
            What the day looked like on paper.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          {event.highlight}. Same Melali rule: stay together, finish together.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
        {event.stats.map((stat) => (
          <li className="bg-background px-5 py-6 sm:px-6" key={stat.label}>
            <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {stat.value}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function EventPhotos({ event }: { event: PastEvent }) {
  const [lead, ...rest] = event.photos
  const closing = rest.length > 0 ? rest[rest.length - 1] : undefined
  const middle = rest.slice(0, -1)

  return (
    <section className="bg-background px-5 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.22em] uppercase">
            <span aria-hidden className="h-px w-8 bg-foreground" />
            From the road
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.75rem,4vw,2.75rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
            Frames from Melali {event.year}.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          Start lines, climbs, regroups, and the finish back at UC.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:gap-4">
        {lead ? <PhotoTile photo={lead} priority sizes="100vw" /> : null}

        {middle.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {middle.map((photo) => (
              <li key={photo.image}>
                <PhotoTile photo={photo} sizes="(min-width: 1024px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        ) : null}

        {closing ? <PhotoTile photo={closing} sizes="100vw" /> : null}
      </div>
    </section>
  )
}

function PhotoTile({
  photo,
  sizes,
  priority = false,
}: {
  photo: PastEvent['photos'][number]
  sizes: string
  priority?: boolean
}) {
  const wide = photo.span === 'wide' || !photo.span

  return (
    <figure className="group overflow-hidden bg-secondary">
      <div
        className={cn(
          'relative overflow-hidden',
          wide ? 'aspect-[16/9] sm:aspect-[21/9]' : 'aspect-square',
        )}
      >
        <img
          alt={photo.imageAlt}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          height={1200}
          sizes={sizes}
          src={`${photo.image}&w=1400&q=75`}
          srcSet={`${photo.image}&w=700&q=70 700w, ${photo.image}&w=1400&q=75 1400w`}
          width={1400}
        />
      </div>
      <figcaption className="border-t border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        {photo.caption}
      </figcaption>
    </figure>
  )
}

function EventTestimonials({ event }: { event: PastEvent }) {
  return (
    <section className="bg-secondary px-5 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mb-10 max-w-2xl lg:mb-12">
        <p className="flex items-center gap-3 text-xs font-medium tracking-[0.22em] uppercase">
          <span aria-hidden className="h-px w-8 bg-foreground" />
          From the bunch
        </p>
        <h2 className="mt-4 font-heading text-[clamp(1.75rem,4vw,2.75rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
          Voices from the road.
        </h2>
      </div>

      <ul className="grid gap-px bg-border md:grid-cols-3">
        {event.testimonials.map((item) => (
          <li className="flex flex-col bg-background p-6 sm:p-8" key={item.name}>
            <blockquote className="flex-1 font-heading text-xl leading-snug font-medium tracking-[-0.02em] text-balance sm:text-2xl">
              “{item.quote}”
            </blockquote>

            <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
              <img
                alt={item.imageAlt}
                className="size-12 object-cover"
                decoding="async"
                height={96}
                src={`${item.image}&w=96&h=96&q=70&crop=faces`}
                width={96}
              />
              <div>
                <p className="font-heading text-sm font-semibold tracking-tight">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.role} · {item.club}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

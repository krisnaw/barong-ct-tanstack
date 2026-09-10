import { ArrowUpRightIcon, ClockIcon, MapPinIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const STRAVA_CLUB = 'https://www.strava.com/clubs/barongcyclingteam'

const rides = [
  {
    day: 'Tuesday',
    name: 'Quickie',
    meet: 'Mantra Gate',
    detail: 'Midweek pace-on. Finish in Ubud.',
  },
  {
    day: 'Thursday',
    name: 'Foreplay',
    meet: 'Lumintang Park',
    detail: 'Social ride. The bunch stays together.',
  },
  {
    day: 'Saturday',
    name: 'Climax',
    meet: 'Posted Friday evening',
    detail: 'The weekly long ride — location announced on Strava every Friday.',
  },
] as const

export function WeeklyRides() {
  return (
    <section
      className="scroll-mt-6 bg-muted px-5 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      id="rides"
    >
      <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.22em] text-foreground uppercase">
            <span aria-hidden className="h-px w-8 bg-primary" />
            Dedication
          </p>
          <h2 className="mt-4 font-heading text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
            Tuesday. Thursday. Saturday.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Welcome to Barong Cycling Team — Bali’s largest and most consistent
          road and gravel community, proudly riding together since 2016. We
          explore the island’s landscapes and culture. Join a weekly ride.
        </p>
      </div>

      <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <ClockIcon aria-hidden className="size-4" weight="bold" />
          Meet 6:15 AM
        </span>
        <span aria-hidden className="text-border">
          ·
        </span>
        <span>Every week</span>
        <span aria-hidden className="text-border">
          ·
        </span>
        <span>Road and gravel</span>
      </p>

      <ul className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
        {rides.map((ride) => (
          <li className="bg-background p-6 sm:p-8" key={ride.day}>
            <p className="text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              {ride.day}
            </p>
            <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {ride.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {ride.detail}
            </p>

            <dl className="mt-8 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPinIcon
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  weight="bold"
                />
                <dt className="sr-only">Meet</dt>
                <dd className="font-medium">{ride.meet}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <ClockIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                  weight="bold"
                />
                <dt className="sr-only">Time</dt>
                <dd>6:15 AM</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Follow Barong Cycling Team on Strava for Saturday’s Climax pin,
          routes, and who showed up.{' '}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            to="/events"
          >
            Event calendar
          </Link>
        </p>
        <a
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-11 w-full shrink-0 px-5 text-base sm:w-auto',
          )}
          href={STRAVA_CLUB}
          rel="noopener noreferrer"
          target="_blank"
        >
          Follow on Strava
          <ArrowUpRightIcon aria-hidden className="size-4" weight="bold" />
        </a>
      </div>
    </section>
  )
}

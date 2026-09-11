import {
  ClockIcon,
  InstagramLogoIcon,
  MapPinIcon,
} from '@phosphor-icons/react'
import { buttonVariants } from '~/components/ui/button'
import { useTranslations } from '~/lib/i18n'
import { cn } from '~/lib/utils'

const STRAVA_CLUB = 'https://www.strava.com/clubs/barongcyclingteam'
const INSTAGRAM =
  'https://www.instagram.com/barongcyclingteam/?hl=en'

export function WeeklyRides() {
  const t = useTranslations()

  return (
    <section
      className="scroll-mt-6 bg-muted px-5 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      id="rides"
    >
      <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.22em] text-foreground uppercase">
            <span aria-hidden className="h-px w-8 bg-primary" />
            {t.rides.eyebrow}
          </p>
          <h2 className="mt-4 font-heading text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
            {t.rides.title}
          </h2>
        </div>
        <div className="flex max-w-xl flex-col items-start gap-4">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.rides.body}
          </p>
          <div className="flex items-center gap-1">
            <a
              aria-label={t.rides.followStrava}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'lg' }),
                'px-3',
              )}
              href={STRAVA_CLUB}
              rel="noopener noreferrer"
              target="_blank"
            >
              <img
                alt=""
                className="h-5 w-auto"
                height={20}
                src="/Strava_Logo.svg"
                width={95}
              />
            </a>
            <a
              aria-label={t.rides.followIg}
              className={buttonVariants({ variant: 'ghost', size: 'icon-lg' })}
              href={INSTAGRAM}
              rel="noopener noreferrer"
              target="_blank"
            >
              <InstagramLogoIcon aria-hidden className="size-5" weight="fill" />
            </a>
          </div>
        </div>
      </div>

      <ul className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
        {t.rides.items.map((ride) => (
          <li className="bg-background p-6 sm:p-8" key={ride.name}>
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
                <dt className="sr-only">{t.rides.meet}</dt>
                <dd className="font-medium">{ride.meet}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <ClockIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                  weight="bold"
                />
                <dt className="sr-only">{t.rides.time}</dt>
                <dd>{t.rides.timeValue}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  )
}

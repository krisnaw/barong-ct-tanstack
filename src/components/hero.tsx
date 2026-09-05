import { ArrowRightIcon, MapPinIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop'

const rides = [
  {
    day: 'Tue',
    name: 'Quickie',
    detail: '50–60 km. Pace on, finish in Ubud.',
  },
  {
    day: 'Thu',
    name: 'Foreplay',
    detail: 'Social ride. The bunch stays together.',
  },
  {
    day: 'Sat',
    name: 'Climax',
    detail: '100 km, 1,000 m+. Kintamani or Jatiluwih.',
  },
] as const

export function Hero() {
  return (
    <section className="relative isolate min-h-[calc(100dvh-4.25rem)] overflow-x-clip bg-foreground text-white">
      <div className="absolute inset-x-0 top-0 z-20 h-px bg-white/30" />

      <img
        alt="Road cyclists packed in a peloton on an open country road"
        className="absolute inset-0 size-full object-cover object-[72%_center]"
        decoding="async"
        fetchPriority="high"
        height={1600}
        sizes="100vw"
        src={`${HERO_IMAGE}&w=1600&q=75`}
        srcSet={`${HERO_IMAGE}&w=800&q=70 800w, ${HERO_IMAGE}&w=1600&q=75 1600w, ${HERO_IMAGE}&w=2400&q=80 2400w`}
        width={2400}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/70 to-foreground/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/25 to-foreground/40" />

      <div className="relative z-10 flex min-h-[calc(100dvh-4.25rem)] flex-col">
        <div className="mt-10 flex flex-1 flex-col justify-start px-5 pb-6 sm:mt-12 sm:px-8 lg:mt-auto lg:justify-end lg:px-12 lg:pb-8">
          <p className="mb-5 flex items-center gap-2 text-xs font-medium tracking-[0.22em] text-white/70 uppercase sm:text-sm">
            <MapPinIcon aria-hidden className="size-3.5 text-white" weight="bold" />
            Denpasar, Bali
            <span className="text-white/40">·</span>
            Est. 2016
          </p>

          <h1 className="max-w-5xl">
            <span className="block font-heading text-[clamp(4.25rem,16vw,10.5rem)] leading-[0.78] font-semibold tracking-[-0.07em]">
              BARONG
            </span>
            <span
              aria-hidden
              className="mt-4 block h-px w-16 bg-white sm:w-24"
            />
            <span className="mt-5 block max-w-xl font-heading text-[clamp(1.5rem,3.4vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.03em] text-white/95">
              Keep the bunch together.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
            A Denpasar peloton that still shows up three times a week — rice
            terraces, volcano climbs, and a teammate waiting on the next
            corner.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 bg-white px-5 text-base text-foreground hover:bg-white/90',
              )}
              href="#rides"
            >
              Join a ride
              <ArrowRightIcon aria-hidden className="size-4" weight="bold" />
            </a>
            <Link
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-11 border-white/35 bg-transparent px-5 text-base text-white hover:bg-white/10 hover:text-white',
              )}
              to="/events"
            >
              Events
            </Link>
          </div>

          <ul
            className="mt-10 grid scroll-mt-6 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/10 sm:grid-cols-3"
            id="rides"
          >
            {rides.map((ride) => (
              <li
                className="bg-foreground/45 px-5 py-4 backdrop-blur-md sm:px-6"
                key={ride.day}
              >
                <p className="text-[0.65rem] font-medium tracking-[0.2em] text-white/55 uppercase">
                  {ride.day}
                </p>
                <p className="mt-1 font-heading text-lg font-medium tracking-tight">
                  {ride.name}
                </p>
                <p className="mt-1 text-sm leading-snug text-white/65">
                  {ride.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

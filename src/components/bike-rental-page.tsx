import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import {
  bikeCategoryLabels,
  formatDailyRate,
  rentalBikes,
  type BikeAvailability,
  type BikeCategory,
  type RentalBike,
} from '~/data/bike-rental'
import { cn } from '~/lib/utils'

type FleetFilter = 'all' | BikeCategory

const filters: { id: FleetFilter; label: string }[] = [
  { id: 'all', label: 'All bikes' },
  { id: 'road', label: 'Road' },
  { id: 'gravel', label: 'Gravel' },
  { id: 'mountain', label: 'Mountain' },
]

const availabilityLabel: Record<BikeAvailability, string> = {
  available: 'Available',
  limited: 'Limited',
  booked: 'Booked out',
}

const availabilityStyles: Record<BikeAvailability, string> = {
  available: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  limited: 'border-amber-200 bg-amber-50 text-amber-900',
  booked: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

const steps = [
  {
    title: 'Pick a bike',
    body: 'Road, gravel, and one hardtail. Sizes are listed on each bike.',
  },
  {
    title: 'Choose a date',
    body: 'Pick the morning you want the bike.',
  },
  {
    title: 'Choose a pickup time',
    body: 'Collect it before the 6:15 AM roll-out.',
  },
]

export function BikeRentalPage() {
  const [filter, setFilter] = useState<FleetFilter>('all')

  const shown = useMemo(
    () =>
      filter === 'all'
        ? rentalBikes
        : rentalBikes.filter((bike) => bike.category === filter),
    [filter],
  )

  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 max-w-2xl sm:mb-10">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Rentals
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Club bikes
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Borrow a Barong bike for a guest ride or a few days in Bali. Flat
          pedals are on the bike. Clipless pedals are available on request.
        </p>
      </div>

      <ol className="mb-10 grid gap-px border border-border bg-border sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="bg-background px-4 py-4 sm:px-5">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              0{index + 1}
            </p>
            <h2 className="mt-2 font-heading text-base font-medium tracking-tight">
              {step.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <div
        aria-label="Bike type"
        className="mb-6 flex gap-1 border-b border-border"
        role="tablist"
      >
        {filters.map((item) => {
          const active = filter === item.id
          return (
            <button
              aria-selected={active}
              className={cn(
                '-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              key={item.id}
              onClick={() => setFilter(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="border-y border-border py-10 text-sm text-muted-foreground">
          No bikes in this category right now.
        </p>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {shown.map((bike) => (
            <li key={bike.id}>
              <BikeCard bike={bike} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BikeCard({ bike }: { bike: RentalBike }) {
  const booked = bike.availability === 'booked'

  return (
    <Link
      className="flex h-full flex-col border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      params={{ id: bike.id }}
      to="/bike-rental/$id"
    >
      <div className="relative overflow-hidden bg-muted">
        <img
          alt={bike.imageAlt}
          className="aspect-[4/3] w-full object-cover"
          decoding="async"
          height={1050}
          src={bike.image}
          width={1400}
        />
        <span
          className={cn(
            'absolute top-3 right-3 border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.12em] uppercase',
            availabilityStyles[bike.availability],
          )}
        >
          {bike.availability === 'limited' && bike.remaining != null
            ? `${bike.remaining} left`
            : availabilityLabel[bike.availability]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          {bikeCategoryLabels[bike.category]}
        </p>
        <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight">
          {bike.name}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {bike.summary}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Groupset</dt>
            <dd className="mt-0.5">{bike.groupset}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Wheels</dt>
            <dd className="mt-0.5">{bike.wheels}</dd>
          </div>
        </dl>
        <p className="mt-4 text-lg font-medium tracking-tight">
          <span className="mr-2 text-sm font-normal text-muted-foreground">
            Sizes
          </span>
          {bike.sizes.join(' · ')}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="text-sm font-medium tabular-nums">
            {formatDailyRate(bike.dailyRate)}
          </p>
          <span
            className={buttonVariants({
              variant: booked ? 'outline' : 'default',
            })}
          >
            {booked ? 'Unavailable' : 'Details'}
          </span>
        </div>
      </div>
    </Link>
  )
}

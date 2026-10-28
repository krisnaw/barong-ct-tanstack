import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import {
  bikeCategoryLabels,
  formatDailyRate,
  type BikeAvailability,
  type RentalBike,
  type RentalLocationId,
} from '~/data/bike-rental'
import { cn } from '~/lib/utils'

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

export function BikeRentalDetail({
  bike,
  locationId,
}: {
  bike: RentalBike
  locationId?: RentalLocationId
}) {
  const booked = bike.availability === 'booked'
  const [size, setSize] = useState(bike.sizes[0] ?? '')

  return (
    <article className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <Link
        className="text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        search={{ location: locationId }}
        to="/bike-rental"
      >
        Club bikes
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div className="relative h-fit self-start overflow-hidden rounded-lg bg-muted">
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
              'absolute top-3 right-3 rounded-md border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.12em] uppercase',
              availabilityStyles[bike.availability],
            )}
          >
            {bike.availability === 'limited' && bike.remaining != null
              ? `${bike.remaining} left`
              : availabilityLabel[bike.availability]}
          </span>
        </div>

        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {bikeCategoryLabels[bike.category]}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {bike.name}
          </h1>
          <p className="mt-2 font-heading text-xl font-medium tracking-tight tabular-nums">
            {formatDailyRate(bike.dailyRate)}
          </p>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
            {bike.summary}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Groupset</dt>
              <dd className="mt-1">{bike.groupset}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Wheels</dt>
              <dd className="mt-1">{bike.wheels}</dd>
            </div>
          </dl>

          <fieldset className="mt-6" disabled={booked}>
            <legend className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Size
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {bike.sizes.map((option) => {
                const active = size === option
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      'min-w-14 rounded-lg border px-4 py-3 text-lg font-medium tracking-tight transition-colors',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={option}
                    onClick={() => setSize(option)}
                    type="button"
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Button
            className="mt-6 w-full"
            disabled={booked || !size}
            size="lg"
            type="button"
          >
            {booked ? 'Unavailable' : size ? `Add ${size} to bag` : 'Select a size'}
          </Button>
        </div>
      </div>
    </article>
  )
}

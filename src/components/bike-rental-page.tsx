import { useMemo, useState } from 'react'
import { MapPinIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import {
  bikeCategoryLabels,
  findRentalLocation,
  formatDailyRate,
  rentalBikes,
  rentalLocationName,
  rentalLocations,
  type BikeAvailability,
  type BikeCategory,
  type RentalBike,
  type RentalLocationId,
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
    title: 'Choose a location',
    body: 'Canggu, Denpasar, Ubud, or Buleleng. The list shows bikes stationed there.',
  },
  {
    title: 'Pick a bike',
    body: 'Road, gravel, or mountain, depending on what is stationed there.',
  },
  {
    title: 'Set the pickup',
    body: 'Choose a date and a time before the 6:15 AM roll-out.',
  },
]

export function BikeRentalPage({
  locationId,
  onLocationChange,
}: {
  locationId?: RentalLocationId
  onLocationChange: (locationId: RentalLocationId | undefined) => void
}) {
  const [filter, setFilter] = useState<FleetFilter>('all')
  const location = findRentalLocation(locationId)

  const atLocation = useMemo(
    () =>
      locationId
        ? rentalBikes.filter((bike) => bike.locations.includes(locationId))
        : rentalBikes,
    [locationId],
  )

  const shown = useMemo(
    () =>
      filter === 'all'
        ? atLocation
        : atLocation.filter((bike) => bike.category === filter),
    [atLocation, filter],
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
          Borrow a Barong bike for a guest ride or a few days in Bali. Choose
          where you are staying, then pick a bike you can collect there.
        </p>
      </div>

      <LocationPicker
        locationId={locationId}
        onLocationChange={onLocationChange}
      />

      {location ? (
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {location.note}
        </p>
      ) : null}

      <ol className="mb-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
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
        <p className="rounded-lg border border-border px-4 py-10 text-sm text-muted-foreground">
          {location
            ? filter === 'all'
              ? `No bikes in ${location.name} right now.`
              : `No ${bikeCategoryLabels[filter].toLowerCase()} bikes in ${location.name} right now.`
            : 'No bikes in this category right now.'}
        </p>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {shown.map((bike) => (
            <li key={bike.id}>
              <BikeCard bike={bike} locationId={locationId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function LocationPicker({
  locationId,
  onLocationChange,
}: {
  locationId?: RentalLocationId
  onLocationChange: (locationId: RentalLocationId | undefined) => void
}) {
  const options: { id: RentalLocationId | undefined; area: string; name: string }[] =
    [
      { id: undefined, area: 'Bali', name: 'All locations' },
      ...rentalLocations.map((item) => ({
        id: item.id,
        area: item.area,
        name: item.name,
      })),
    ]

  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-1.5 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        <MapPinIcon aria-hidden className="size-3.5" weight="bold" />
        Where are you riding
      </h2>
      <div
        aria-label="Pickup location"
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {options.map((option, index) => {
          const active = locationId === option.id
          const optionId = option.id
          const count =
            optionId == null
              ? rentalBikes.length
              : rentalBikes.filter((bike) => bike.locations.includes(optionId))
                  .length
          const lastOnMobile = index === options.length - 1
          return (
            <button
              aria-pressed={active}
              className={cn(
                'rounded-lg border px-3 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                lastOnMobile && 'max-sm:col-span-2',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40',
              )}
              key={option.name}
              onClick={() => onLocationChange(option.id)}
              type="button"
            >
              <span
                className={cn(
                  'text-[0.65rem] font-medium tracking-[0.16em] uppercase',
                  active ? 'text-background/70' : 'text-muted-foreground',
                )}
              >
                {option.area}
              </span>
              <span className="mt-1 block font-heading text-base font-medium tracking-tight">
                {option.name}
              </span>
              <span
                className={cn(
                  'mt-1 block text-xs tabular-nums',
                  active ? 'text-background/70' : 'text-muted-foreground',
                )}
              >
                {count} {count === 1 ? 'bike' : 'bikes'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BikeCard({
  bike,
  locationId,
}: {
  bike: RentalBike
  locationId?: RentalLocationId
}) {
  const booked = bike.availability === 'booked'
  const pickup = locationId
    ? rentalLocationName(locationId)
    : bike.locations.map((id) => rentalLocationName(id)).join(' · ')

  return (
    <Link
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      params={{ id: bike.id }}
      search={{ location: locationId }}
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
            'absolute top-3 right-3 rounded-md border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.12em] uppercase',
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
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Pickup</dt>
            <dd className="mt-0.5">{pickup}</dd>
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

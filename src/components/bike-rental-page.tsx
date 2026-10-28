import { useId, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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

const locationFilterItems: { value: 'all' | RentalLocationId; label: string }[] =
  [
    { value: 'all', label: 'All locations' },
    ...rentalLocations.map((item) => ({ value: item.id, label: item.name })),
  ]

const typeFilterItems: { value: FleetFilter; label: string }[] = [
  { value: 'all', label: 'All bikes' },
  { value: 'road', label: 'Road' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'mountain', label: 'Mountain' },
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

export function BikeRentalPage({
  locationId,
  onLocationChange,
}: {
  locationId?: RentalLocationId
  onLocationChange: (locationId: RentalLocationId | undefined) => void
}) {
  const [filter, setFilter] = useState<FleetFilter>('all')
  const locationFilterId = useId()
  const typeFilterId = useId()
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

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor={locationFilterId}>Location</Label>
          <Select
            items={locationFilterItems}
            onValueChange={(value) => {
              if (value == null || value === 'all') {
                onLocationChange(undefined)
                return
              }
              const next = rentalLocations.find((item) => item.id === value)
              if (next) onLocationChange(next.id)
            }}
            value={locationId ?? 'all'}
          >
            <SelectTrigger className="min-w-40" id={locationFilterId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {locationFilterItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={typeFilterId}>Type</Label>
          <Select
            items={typeFilterItems}
            onValueChange={(value) => {
              if (
                value === 'all' ||
                value === 'road' ||
                value === 'gravel' ||
                value === 'mountain'
              ) {
                setFilter(value)
              }
            }}
            value={filter}
          >
            <SelectTrigger className="min-w-32" id={typeFilterId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {typeFilterItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

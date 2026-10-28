import { useState } from 'react'
import { CalendarBlankIcon } from '@phosphor-icons/react'
import { format, startOfDay } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Field, FieldError, FieldGroup, FieldLabel } from '~/components/ui/field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  bikeCategoryLabels,
  findRentalLocation,
  formatDailyRate,
  pickupTimes,
  rentalLocationName,
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

type RequestForm = {
  date: string
  locationId: RentalLocationId | ''
  pickupTime: string
  size: string
}

function emptyForm(
  bike: RentalBike,
  preferredLocation?: RentalLocationId,
): RequestForm {
  const locationId =
    preferredLocation && bike.locations.includes(preferredLocation)
      ? preferredLocation
      : (bike.locations[0] ?? '')
  return {
    date: '',
    locationId,
    pickupTime: pickupTimes[0] ?? '',
    size: bike.sizes[0] ?? '',
  }
}

export function BikeRentalDetail({
  bike,
  locationId,
}: {
  bike: RentalBike
  locationId?: RentalLocationId
}) {
  const booked = bike.availability === 'booked'
  const [form, setForm] = useState<RequestForm>(() =>
    emptyForm(bike, locationId),
  )
  const pickupLocations = bike.locations.flatMap((id) => {
    const location = findRentalLocation(id)
    return location ? [location] : []
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const selectedDate = parseRentalDate(form.date)

  function submitRequest() {
    if (!form.locationId) {
      setFormError('Choose a pickup location.')
      return
    }
    if (!form.date) {
      setFormError('Choose a date.')
      return
    }
    if (!form.pickupTime) {
      setFormError('Choose a pickup time.')
      return
    }
    setFormError(null)
    setSubmitted(true)
  }

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
              Frame size
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {bike.sizes.map((size) => {
                const active = form.size === size
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      'min-w-14 rounded-lg border px-4 py-3 text-lg font-medium tracking-tight transition-colors',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={size}
                    onClick={() =>
                      setForm((current) => ({ ...current, size }))
                    }
                    type="button"
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <ul className="mt-6 space-y-1 text-sm text-muted-foreground">
            <li>Flat pedals are on the bike. Clipless pedals are on request.</li>
            <li>Helmets are not included.</li>
            <li>
              Pickup in{' '}
              {pickupLocations.map((item) => item.name).join(', ')}.
            </li>
          </ul>

          {submitted ? (
            <div className="mt-8 rounded-lg border border-border p-4">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Request noted
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {bike.name}, size {form.size}. Collect in{' '}
                {rentalLocationName(form.locationId)} on{' '}
                {formatDisplayDate(form.date)} at {formatPickupTime(form.pickupTime)}.
                A ride captain confirms this once booking is live.
              </p>
            </div>
          ) : (
            <form
              className="mt-8 border-t border-border pt-6"
              onSubmit={(event) => {
                event.preventDefault()
                if (!booked) submitRequest()
              }}
            >
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Request this bike
              </h2>
              {booked ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  This bike is out with a rider. Check back for the next open
                  dates.
                </p>
              ) : (
                <FieldGroup className="mt-4">
                  <fieldset>
                    <legend className="text-sm font-medium">
                      Pickup location
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pickupLocations.map((item) => {
                        const active = form.locationId === item.id
                        return (
                          <button
                            aria-pressed={active}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                              active
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border hover:border-foreground/40',
                            )}
                            key={item.id}
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                locationId: item.id,
                              }))
                            }
                            type="button"
                          >
                            {item.name}
                          </button>
                        )
                      })}
                    </div>
                    {form.locationId ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {findRentalLocation(form.locationId)?.note}
                      </p>
                    ) : null}
                  </fieldset>
                  <Field>
                    <FieldLabel htmlFor="rental-date">Date</FieldLabel>
                    <Popover onOpenChange={setDateOpen} open={dateOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
                            data-empty={!selectedDate}
                            id="rental-date"
                            type="button"
                            variant="outline"
                          />
                        }
                      >
                        <CalendarBlankIcon weight="bold" />
                        {selectedDate
                          ? format(selectedDate, 'd MMMM yyyy')
                          : 'Pick a date'}
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          disabled={{ before: startOfDay(new Date()) }}
                          mode="single"
                          onSelect={(next) => {
                            setForm((current) => ({
                              ...current,
                              date: next ? format(next, 'yyyy-MM-dd') : '',
                            }))
                            if (next) setDateOpen(false)
                          }}
                          selected={selectedDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <fieldset>
                    <legend className="text-sm font-medium">Pickup time</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pickupTimes.map((time) => {
                        const active = form.pickupTime === time
                        return (
                          <button
                            aria-pressed={active}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors',
                              active
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border hover:border-foreground/40',
                            )}
                            key={time}
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                pickupTime: time,
                              }))
                            }
                            type="button"
                          >
                            {formatPickupTime(time)}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                  <FieldError>{formError}</FieldError>
                  <Button type="submit">Add request</Button>
                </FieldGroup>
              )}
            </form>
          )}
        </div>
      </div>
    </article>
  )
}

function parseRentalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatPickupTime(value: string) {
  const [hourText, minuteText] = value.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

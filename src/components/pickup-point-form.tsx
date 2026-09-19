import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ACCOUNT_PROVINCES } from '~/lib/account'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Spinner } from '~/components/ui/spinner'
import type { PickupPoint } from '~/data/pickup-points'
import { cn } from '~/lib/utils'

export type PickupPointInput = {
  name: string
  address: string
  city: string
  province: string
  postal: string
  hours: string
  notes: string
  phone: string
  active: boolean
  sortOrder: number
}

const textareaClassName =
  'min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const selectClassName =
  'h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function emptyValues(): PickupPointInput {
  return {
    name: '',
    address: '',
    city: '',
    province: 'Bali',
    postal: '',
    hours: '',
    notes: '',
    phone: '',
    active: true,
    sortOrder: 0,
  }
}

function fromPoint(point: PickupPoint): PickupPointInput {
  return {
    name: point.name,
    address: point.address,
    city: point.city,
    province: point.province,
    postal: point.postal,
    hours: point.hours,
    notes: point.notes,
    phone: point.phone,
    active: point.active,
    sortOrder: point.sortOrder,
  }
}

export function PickupPointForm({
  point,
  saving,
  submitLabel,
  onSubmit,
}: {
  point?: PickupPoint
  saving: boolean
  submitLabel: string
  onSubmit: (values: PickupPointInput) => Promise<void>
}) {
  const [values, setValues] = React.useState<PickupPointInput>(() =>
    point ? fromPoint(point) : emptyValues(),
  )

  React.useEffect(() => {
    setValues(point ? fromPoint(point) : emptyValues())
  }, [point])

  function patch<K extends keyof PickupPointInput>(
    key: K,
    value: PickupPointInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <form
      className="max-w-2xl space-y-6 border border-border p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit({
          ...values,
          name: values.name.trim(),
          address: values.address.trim(),
          city: values.city.trim(),
          province: values.province.trim(),
          postal: values.postal.trim(),
          hours: values.hours.trim(),
          notes: values.notes.trim(),
          phone: values.phone.trim(),
        })
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            onChange={(event) => patch('name', event.target.value)}
            placeholder="Barong Studio"
            required
            value={values.name}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Input
            id="address"
            onChange={(event) => patch('address', event.target.value)}
            placeholder="Jl. Raya Sanggingan"
            required
            value={values.address}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input
              id="city"
              onChange={(event) => patch('city', event.target.value)}
              placeholder="Ubud"
              required
              value={values.city}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="province">Province</FieldLabel>
            <select
              className={selectClassName}
              id="province"
              onChange={(event) => patch('province', event.target.value)}
              value={values.province}
            >
              {[values.province, ...ACCOUNT_PROVINCES]
                .filter((option, index, all) => all.indexOf(option) === index)
                .map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="postal">Postal code</FieldLabel>
            <Input
              id="postal"
              onChange={(event) => patch('postal', event.target.value)}
              placeholder="80571"
              required
              value={values.postal}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="hours">Pickup hours</FieldLabel>
          <Input
            id="hours"
            onChange={(event) => patch('hours', event.target.value)}
            placeholder="Tue / Thu 06:00–08:00 after the ride"
            value={values.hours}
          />
          <FieldDescription>
            Shown to customers when they choose pickup at checkout.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Contact phone (optional)</FieldLabel>
          <Input
            id="phone"
            onChange={(event) => patch('phone', event.target.value)}
            placeholder="0812 3456 7890"
            type="tel"
            value={values.phone}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
          <textarea
            className={textareaClassName}
            id="notes"
            onChange={(event) => patch('notes', event.target.value)}
            placeholder="Ask for Krisna at the cafe. Park behind the studio."
            value={values.notes}
          />
        </Field>

        <div className="flex items-center gap-2">
          <Switch
            aria-label={values.active ? 'Active' : 'Inactive'}
            checked={values.active}
            onCheckedChange={(checked) => patch('active', checked)}
          />
          <span className="text-sm">
            {values.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </FieldGroup>

      <div className="flex items-center justify-between gap-3">
        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          to="/dashboard/pickup-points"
        >
          Cancel
        </Link>
        <Button disabled={saving} type="submit">
          {saving ? (<><Spinner /> Saving…</>) : submitLabel}
        </Button>
      </div>
    </form>
  )
}

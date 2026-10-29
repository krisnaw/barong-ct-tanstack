import * as React from 'react'
import { CalendarBlankIcon } from '@phosphor-icons/react'
import { format, startOfDay } from 'date-fns'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { ACCOUNT_PROVINCES } from '~/lib/account'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'

export function SaveBar({
  pending,
  label = 'Save',
}: {
  pending?: boolean
  label?: string
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
      <Button disabled={pending} size="lg" type="submit">
        {pending ? (<><Spinner /> Saving…</>) : label}
      </Button>
    </div>
  )
}

type AddressValues = {
  address: string
  apartment: string
  city: string
  province: string
  postal: string
}

export function AddressFields({
  value,
  onChange,
  idPrefix,
  allowEmptyProvince = false,
}: {
  value: AddressValues
  onChange: (key: keyof AddressValues, next: string) => void
  idPrefix: string
  allowEmptyProvince?: boolean
}) {
  return (
    <div className="mt-5 grid gap-3">
      <AccountField
        autoComplete="address-line1"
        id={`${idPrefix}-address`}
        label="Address"
        onChange={(next) => onChange('address', next)}
        value={value.address}
      />
      <AccountField
        autoComplete="address-line2"
        id={`${idPrefix}-apartment`}
        label="Apartment, suite, etc. (optional)"
        onChange={(next) => onChange('apartment', next)}
        value={value.apartment}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <AccountField
          autoComplete="address-level2"
          id={`${idPrefix}-city`}
          label="City"
          onChange={(next) => onChange('city', next)}
          value={value.city}
        />
        <AccountSelect
          allowEmpty={allowEmptyProvince}
          id={`${idPrefix}-province`}
          label="Province"
          onChange={(next) => onChange('province', next)}
          options={ACCOUNT_PROVINCES.map((option) => ({
            value: option,
            label: option,
          }))}
          placeholder="Province"
          value={value.province}
        />
        <AccountField
          autoComplete="postal-code"
          id={`${idPrefix}-postal`}
          label="Postal code"
          onChange={(next) => onChange('postal', next)}
          value={value.postal}
        />
      </div>
    </div>
  )
}

export function AccountDateOfBirthField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseDateOfBirth(value)
  const today = startOfDay(new Date())
  const startMonth = new Date(1920, 0)
  const defaultMonth =
    selected ?? new Date(today.getFullYear() - 25, today.getMonth(), 1)

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              className="w-full justify-start gap-2 font-normal data-[empty=true]:text-muted-foreground"
              data-empty={!selected}
              id={id}
              type="button"
              variant="outline"
            />
          }
        >
          <CalendarBlankIcon className="size-4 shrink-0" weight="bold" />
          <span className="min-w-0 flex-1 truncate text-left">
            {selected ? format(selected, 'd MMMM yyyy') : 'Pick a date'}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            captionLayout="dropdown"
            defaultMonth={defaultMonth}
            disabled={{ after: today }}
            endMonth={today}
            mode="single"
            onSelect={(next) => {
              onChange(next ? format(next, 'yyyy-MM-dd') : '')
              if (next) setOpen(false)
            }}
            selected={selected}
            startMonth={startMonth}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}

function parseDateOfBirth(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return undefined
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function AccountField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error,
  readOnly,
  required,
}: {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  type?: string
  autoComplete?: string
  error?: string
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cn(
          readOnly && 'cursor-default bg-muted text-muted-foreground',
        )}
        id={id}
        onChange={
          readOnly || !onChange
            ? undefined
            : (event) => onChange(event.target.value)
        }
        readOnly={readOnly}
        required={required}
        type={type}
        value={value}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

export function AccountSelect({
  id,
  label,
  value,
  onChange,
  options,
  allowEmpty = false,
  placeholder = 'Select',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  allowEmpty?: boolean
  placeholder?: string
}) {
  const items = allowEmpty
    ? [{ value: '', label: placeholder }, ...options]
    : options

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={items}
        onValueChange={(next) => {
          if (next != null) onChange(next)
        }}
        value={value}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((option) => (
            <SelectItem
              key={option.value || '__empty__'}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

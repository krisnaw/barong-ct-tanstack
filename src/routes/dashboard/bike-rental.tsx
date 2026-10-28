import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  bikeCategoryLabels,
  formatDailyRate,
  rentalBikes,
  rentalLocationName,
  rentalLocations,
  type BikeAvailability,
  type BikeCategory,
  type RentalBike,
  type RentalLocationId,
} from '~/data/bike-rental'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

const categoryItems = (
  Object.entries(bikeCategoryLabels) as [BikeCategory, string][]
).map(([value, label]) => ({ value, label }))

const availabilityItems: { value: BikeAvailability; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited' },
  { value: 'booked', label: 'Booked out' },
]

const availabilityLabel = Object.fromEntries(
  availabilityItems.map((item) => [item.value, item.label]),
) as Record<BikeAvailability, string>

export const Route = createFileRoute('/dashboard/bike-rental')({
  head: () => ({
    meta: seo({
      title: 'Bike rental · Dashboard | Barong Cycling Team',
      description: 'Manage the Barong Cycling Team rental fleet.',
    }),
  }),
  component: DashboardBikeRentalPage,
})

function DashboardBikeRentalPage() {
  const [bikes, setBikes] = useState<RentalBike[]>(() =>
    rentalBikes.map((bike) => ({
      ...bike,
      locations: [...bike.locations],
      sizes: [...bike.sizes],
    })),
  )
  const [editor, setEditor] = useState<RentalBike | 'new' | null>(null)

  function saveBike(next: RentalBike) {
    setBikes((current) => {
      const index = current.findIndex((bike) => bike.id === next.id)
      if (index === -1) return [...current, next]
      return current.map((bike) => (bike.id === next.id ? next : bike))
    })
    setEditor(null)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Bike rental</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Bike rental
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {bikes.length} {bikes.length === 1 ? 'bike' : 'bikes'}
            </p>
          </div>
          <Button onClick={() => setEditor('new')} type="button">
            Add bike
          </Button>
        </div>

        {bikes.length === 0 ? (
          <p className="rounded-lg border border-border px-4 py-8 text-sm text-muted-foreground">
            No bikes yet. Add one for a pickup location.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Bike</TableHead>
                  <TableHead className="px-4">Size</TableHead>
                  <TableHead className="px-4">Type</TableHead>
                  <TableHead className="px-4">Locations</TableHead>
                  <TableHead className="px-4">Rate</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bikes.map((bike) => (
                  <TableRow key={bike.id}>
                    <TableCell className="px-4 py-3 font-medium">
                      {bike.name}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {bike.sizes.join(', ')}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {bikeCategoryLabels[bike.category]}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {bike.locations.map((id) => rentalLocationName(id)).join(', ')}
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">
                      {formatDailyRate(bike.dailyRate)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      {availabilityLabel[bike.availability]}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => setEditor(bike)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            setBikes((current) =>
                              current.filter((item) => item.id !== bike.id),
                            )
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <BikeFormDialog
        bike={editor === 'new' ? undefined : (editor ?? undefined)}
        onOpenChange={(open) => {
          if (!open) setEditor(null)
        }}
        onSave={saveBike}
        open={editor != null}
      />
    </>
  )
}

function BikeFormDialog({
  bike,
  open,
  onOpenChange,
  onSave,
}: {
  bike?: RentalBike
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (bike: RentalBike) => void
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <BikeForm
            bike={bike}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function BikeForm({
  bike,
  onCancel,
  onSave,
}: {
  bike?: RentalBike
  onCancel: () => void
  onSave: (bike: RentalBike) => void
}) {
  const [name, setName] = useState(bike?.name ?? '')
  const [category, setCategory] = useState<BikeCategory>(bike?.category ?? 'road')
  const [dailyRate, setDailyRate] = useState(
    bike ? String(bike.dailyRate) : '',
  )
  const [locations, setLocations] = useState<RentalLocationId[]>(
    bike?.locations ?? [],
  )
  const [availability, setAvailability] = useState<BikeAvailability>(
    bike?.availability ?? 'available',
  )
  const [sizes, setSizes] = useState(bike?.sizes.join(', ') ?? '')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const trimmedName = name.trim()
    const rate = Number(dailyRate.replace(/[^\d]/g, ''))
    const parsedSizes = sizes
      .split(/[,·]/)
      .map((size) => size.trim())
      .filter(Boolean)
    if (!trimmedName) {
      setError('Enter a bike name.')
      return
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      setError('Enter a daily rate.')
      return
    }
    if (locations.length === 0) {
      setError('Choose at least one location.')
      return
    }
    if (parsedSizes.length === 0) {
      setError('Enter at least one size.')
      return
    }
    onSave({
      id: bike?.id ?? createBikeId(trimmedName),
      name: trimmedName,
      category,
      groupset: bike?.groupset ?? '—',
      wheels: bike?.wheels ?? '—',
      sizes: parsedSizes,
      locations,
      dailyRate: rate,
      availability,
      remaining:
        availability === 'booked' ? 0 : availability === 'limited' ? 1 : 2,
      summary: bike?.summary ?? '',
      image: bike?.image ?? '/bikes/domane.jpg',
      imageAlt: bike?.imageAlt ?? trimmedName,
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{bike ? 'Edit bike' : 'Add bike'}</DialogTitle>
        <DialogDescription>
          Name, type, locations, rate, and sizes for this rental bike.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="rental-bike-name">Name</FieldLabel>
          <Input
            id="rental-bike-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="rental-bike-category">Type</FieldLabel>
          <Select
            items={categoryItems}
            onValueChange={(value) => {
              if (value === 'road' || value === 'gravel' || value === 'mountain') {
                setCategory(value)
              }
            }}
            value={category}
          >
            <SelectTrigger className="w-full" id="rental-bike-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <fieldset>
          <legend className="text-sm font-medium">Locations</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {rentalLocations.map((location) => {
              const active = locations.includes(location.id)
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                  )}
                  key={location.id}
                  onClick={() =>
                    setLocations((current) =>
                      active
                        ? current.filter((id) => id !== location.id)
                        : [...current, location.id],
                    )
                  }
                  type="button"
                >
                  {location.name}
                </button>
              )
            })}
          </div>
        </fieldset>
        <Field>
          <FieldLabel htmlFor="rental-bike-rate">Daily rate (IDR)</FieldLabel>
          <Input
            id="rental-bike-rate"
            inputMode="numeric"
            onChange={(event) => setDailyRate(event.target.value)}
            placeholder="250000"
            value={dailyRate}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="rental-bike-status">Status</FieldLabel>
          <Select
            items={availabilityItems}
            onValueChange={(value) => {
              if (
                value === 'available' ||
                value === 'limited' ||
                value === 'booked'
              ) {
                setAvailability(value)
              }
            }}
            value={availability}
          >
            <SelectTrigger className="w-full" id="rental-bike-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availabilityItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="rental-bike-sizes">Sizes</FieldLabel>
          <Input
            id="rental-bike-sizes"
            onChange={(event) => setSizes(event.target.value)}
            placeholder="52, 54, 56"
            value={sizes}
          />
        </Field>
        <FieldError>{error}</FieldError>
      </FieldGroup>
      <DialogFooter>
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button onClick={save} type="button">
          {bike ? 'Save' : 'Add bike'}
        </Button>
      </DialogFooter>
    </>
  )
}

function createBikeId(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'bike'
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}

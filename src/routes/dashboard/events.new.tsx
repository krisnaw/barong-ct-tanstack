import * as React from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/events/new')({
  head: () => ({
    meta: seo({
      title: 'Create event · Dashboard | Barong Cycling Team',
      description: 'Create a new Barong Cycling Team event.',
    }),
  }),
  component: DashboardCreateEventPage,
})

function DashboardCreateEventPage() {
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [date, setDate] = React.useState('')
  const [time, setTime] = React.useState('05:30 WITA')
  const [location, setLocation] = React.useState('')
  const [distance, setDistance] = React.useState('')
  const [fee, setFee] = React.useState('Free')
  const [capacity, setCapacity] = React.useState('')
  const [status, setStatus] = React.useState<'open' | 'upcoming'>('upcoming')
  const [registration, setRegistration] = React.useState<'simple' | 'full'>(
    'simple',
  )
  const [blurb, setBlurb] = React.useState('')
  const [description, setDescription] = React.useState('')

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    // Stub only — wire persistence later.
    void navigate({ to: '/dashboard/events' })
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/dashboard/events" />}>
                  Events
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Create</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Create event
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft a ride or Melali. Saving is stubbed for now.
          </p>
        </div>

        <form
          className="max-w-2xl space-y-6 border border-border p-5 sm:p-6"
          onSubmit={onSubmit}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Event name</FieldLabel>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Saturday Climax — Jatiluwih"
                required
                value={name}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Input
                  id="date"
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="19 September 2026"
                  required
                  value={date}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="time">Time</FieldLabel>
                <Input
                  id="time"
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="05:30 WITA"
                  required
                  value={time}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="location">Start location</FieldLabel>
              <Input
                id="location"
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Denpasar meet point"
                required
                value={location}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="distance">Distance</FieldLabel>
                <Input
                  id="distance"
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="100 km"
                  required
                  value={distance}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fee">Fee</FieldLabel>
                <Input
                  id="fee"
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="Free"
                  value={fee}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
              <Input
                id="capacity"
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="60"
                value={capacity}
              />
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {(['upcoming', 'open'] as const).map((value) => (
                  <button
                    className={cn(
                      'border px-3 py-2 text-sm font-medium transition-colors',
                      status === value
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={value}
                    onClick={() => setStatus(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Registration type</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {(['simple', 'full'] as const).map((value) => (
                  <button
                    className={cn(
                      'border px-3 py-2 text-sm font-medium transition-colors',
                      registration === value
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={value}
                    onClick={() => setRegistration(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
              <FieldDescription>
                Full registration adds jersey, route, and payment steps.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="blurb">Short blurb</FieldLabel>
              <Input
                id="blurb"
                onChange={(e) => setBlurb(e.target.value)}
                placeholder="Weekly long ride up to the crater rim."
                required
                value={blurb}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What riders should know before joining."
                required
                value={description}
              />
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between gap-3">
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              to="/dashboard/events"
            >
              Cancel
            </Link>
            <Button type="submit">Create event</Button>
          </div>
        </form>
      </div>
    </>
  )
}

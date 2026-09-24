import * as React from 'react'
import { CalendarBlankIcon } from '@phosphor-icons/react'
import { format, startOfDay } from 'date-fns'
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
import { Calendar } from '~/components/ui/calendar'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { Switch } from '~/components/ui/switch'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'
import { type EventKind } from '~/data/events'
import { EventFeatureImageField } from '~/components/event-feature-image-field'
import { TextEditor } from '~/components/text-editor'
import { createEvent } from '~/lib/event.functions'
import { seo } from '~/utils/seo'

const eventTypeOptions: { value: EventKind; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'flagship', label: 'Flagship' },
]

const timezoneOptions = [
  { value: 'GMT+8', label: 'GMT+8' },
  { value: 'GMT+7', label: 'GMT+7' },
  { value: 'GMT+9', label: 'GMT+9' },
] as const

type TimezoneOption = (typeof timezoneOptions)[number]['value']

const timezoneSelectItems = timezoneOptions.map((option) => ({
  value: option.value,
  label: option.label,
}))

function slugify(value: string) {
  return slugifyInput(value).replace(/-+$/g, '')
}

function slugifyInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
}

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
  const [slug, setSlug] = React.useState('')
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [date, setDate] = React.useState<Date>()
  const [dateOpen, setDateOpen] = React.useState(false)
  const [time, setTime] = React.useState('05:30')
  const [timezone, setTimezone] = React.useState<TimezoneOption>('GMT+8')
  const [registrationClosesAt, setRegistrationClosesAt] = React.useState<Date>()
  const [registrationClosesOpen, setRegistrationClosesOpen] = React.useState(false)
  const [location, setLocation] = React.useState('')
  const [locationAddress, setLocationAddress] = React.useState('')
  const [kind, setKind] = React.useState<EventKind>('free')
  const [requireJersey, setRequireJersey] = React.useState(false)
  const [requireGroup, setRequireGroup] = React.useState(false)
  const [groupCapacity, setGroupCapacity] = React.useState('8')
  const [description, setDescription] = React.useState('')
  const [regulation, setRegulation] = React.useState('')
  const [featureImage, setFeatureImage] = React.useState('')
  const [featureImageAlt, setFeatureImageAlt] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!date) {
      setSubmitError('Pick an event date.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = await createEvent({
        data: {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          regulation: regulation.trim() || undefined,
          featureImage: featureImage.trim() || undefined,
          featureImageAlt: featureImageAlt.trim() || undefined,
          kind,
          status: 'draft',
          eventDate: format(date, 'yyyy-MM-dd'),
          eventTime: time,
          timeZone: timezone,
          locationName: location.trim(),
          locationAddress: locationAddress.trim() || undefined,
          registrationClosesAt: registrationClosesAt
            ? format(registrationClosesAt, 'yyyy-MM-dd')
            : undefined,
          hasJersey: requireJersey,
          isGroupRide: requireGroup,
          groupCapacity: requireGroup
            ? Number(groupCapacity.replace(/\D/g, '') || 0) || null
            : null,
        },
      })
      void navigate({
        to: '/dashboard/events/$slug',
        params: { slug: created.slug },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create event.',
      )
      setSubmitting(false)
    }
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
            Draft a free ride, paid session, or flagship event.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <FormSection
            description="Name, location, event schedule, and when registration ends."
            title="Event Details"
          >
            <Field>
              <FieldLabel htmlFor="name">Event name</FieldLabel>
              <Input
                id="name"
                onChange={(e) => {
                  const nextName = e.target.value
                  setName(nextName)
                  if (!slugEdited) setSlug(slugify(nextName))
                }}
                placeholder="Saturday Climax — Jatiluwih"
                required
                value={name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                id="slug"
                onChange={(e) => {
                  setSlugEdited(true)
                  setSlug(slugifyInput(e.target.value))
                }}
                onBlur={() => setSlug((current) => slugify(current))}
                placeholder="saturday-climax-jatiluwih"
                required
                value={slug}
              />
              <FieldDescription>
                {slug ? `/events/${slug}` : 'Used in the event URL.'}
              </FieldDescription>
            </Field>

            <div className="grid gap-5 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="date">Event Date</FieldLabel>
                <Popover onOpenChange={setDateOpen} open={dateOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
                        data-empty={!date}
                        id="date"
                        variant="outline"
                      />
                    }
                  >
                    <CalendarBlankIcon weight="bold" />
                    {date ? format(date, 'd MMMM yyyy') : 'Pick a date'}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={{ before: startOfDay(new Date()) }}
                      mode="single"
                      onSelect={(next) => {
                        setDate(next)
                        if (
                          next &&
                          registrationClosesAt &&
                          registrationClosesAt > next
                        ) {
                          setRegistrationClosesAt(undefined)
                        }
                        if (next) setDateOpen(false)
                      }}
                      selected={date}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <FieldLabel htmlFor="time">Event Time</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    className="min-w-0 flex-1"
                    id="time"
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="05:30"
                    required
                    type="time"
                    value={time}
                  />
                  <Select
                    items={timezoneSelectItems}
                    onValueChange={(value) => {
                      if (value == null) return
                      setTimezone(value as TimezoneOption)
                    }}
                    value={timezone}
                  >
                    <SelectTrigger
                      aria-label="Timezone"
                      className="w-[7.5rem] shrink-0"
                      id="timezone"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezoneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="registrationClosesAt">
                  Registration closed at
                </FieldLabel>
                <Popover
                  onOpenChange={setRegistrationClosesOpen}
                  open={registrationClosesOpen}
                >
                  <PopoverTrigger
                    render={
                      <Button
                        className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
                        data-empty={!registrationClosesAt}
                        id="registrationClosesAt"
                        variant="outline"
                      />
                    }
                  >
                    <CalendarBlankIcon weight="bold" />
                    {registrationClosesAt
                      ? format(registrationClosesAt, 'd MMMM yyyy')
                      : 'Pick a date'}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={[
                        { before: startOfDay(new Date()) },
                        ...(date ? [{ after: date }] : []),
                      ]}
                      mode="single"
                      onSelect={(next) => {
                        setRegistrationClosesAt(next)
                        if (next) setRegistrationClosesOpen(false)
                      }}
                      selected={registrationClosesAt}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="location">Location name</FieldLabel>
              <Input
                id="location"
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Denpasar meet point"
                required
                value={location}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="locationAddress">Location address</FieldLabel>
              <Input
                id="locationAddress"
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Jl. Raya Puputan No. 1, Denpasar"
                value={locationAddress}
              />
            </Field>
          </FormSection>

          <FormSection
            description="Free, paid, or flagship, plus optional registration steps. Add categories on the category page after the event is created."
            title="Type & options"
          >
            <Field>
              <FieldLabel>Event Type</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {eventTypeOptions.map((option) => (
                  <button
                    className={cn(
                      'border px-3 py-2 text-sm font-medium transition-colors',
                      kind === option.value
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={option.value}
                    onClick={() => setKind(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Jersey size</p>
                <p className="text-sm text-muted-foreground">
                  Ask riders to pick a jersey size during registration.
                </p>
              </div>
              <Switch
                aria-label="Require jersey size"
                checked={requireJersey}
                onCheckedChange={setRequireJersey}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Require group</p>
                <p className="text-sm text-muted-foreground">
                  Riders must create or join a group before completing registration.
                </p>
              </div>
              <Switch
                aria-label="Require group"
                checked={requireGroup}
                onCheckedChange={setRequireGroup}
              />
            </div>
            {requireGroup ? (
              <Field>
                <FieldLabel htmlFor="groupCapacity">Group capacity</FieldLabel>
                <Input
                  id="groupCapacity"
                  inputMode="numeric"
                  onChange={(e) => setGroupCapacity(e.target.value)}
                  placeholder="8"
                  value={groupCapacity}
                />
                <FieldDescription>
                  Max riders per named group.
                </FieldDescription>
              </Field>
            ) : null}
          </FormSection>

          <FormSection
            description="Event page copy and feature image. Regulation is optional for rules riders should follow."
            title="Description"
          >
            <EventFeatureImageField
              imageAlt={featureImageAlt}
              imageUrl={featureImage}
              onImageAltChange={setFeatureImageAlt}
              onImageUrlChange={setFeatureImage}
            />
            <Field>
              <FieldLabel htmlFor="description">Details</FieldLabel>
              <TextEditor
                id="description"
                onChange={setDescription}
                placeholder="What riders should know before joining."
                value={description}
              />
              <input
                aria-hidden
                className="sr-only"
                readOnly
                required
                tabIndex={-1}
                value={description}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="regulation">Regulation</FieldLabel>
              <TextEditor
                id="regulation"
                onChange={setRegulation}
                placeholder="Optional rules, cut-offs, and kit requirements."
                value={regulation}
              />
            </Field>
          </FormSection>

          <div className="grid gap-6 border-t border-border py-8 md:grid-cols-3">
            <div className="flex flex-wrap items-center justify-end gap-3 md:col-span-2 md:col-start-2">
              {submitError ? (
                <p className="mr-auto text-sm text-destructive">{submitError}</p>
              ) : null}
              <Link
                className={cn(buttonVariants({ variant: 'outline' }))}
                to="/dashboard/events"
              >
                Cancel
              </Link>
              <Button disabled={submitting} type="submit">
                {submitting ? (<><Spinner /> Creating…</>) : 'Create event'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-6 border-t border-border py-8 md:grid-cols-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <FieldGroup className="md:col-span-2">{children}</FieldGroup>
    </section>
  )
}

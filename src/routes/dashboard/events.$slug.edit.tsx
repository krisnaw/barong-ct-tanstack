import * as React from 'react'
import { CalendarBlankIcon } from '@phosphor-icons/react'
import { format } from 'date-fns'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
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
import { toast } from '~/components/ui/toast'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'
import { EventFeatureImageField } from '~/components/event-feature-image-field'
import { TextEditor } from '~/components/text-editor'
import {
  type EventKind,
  type EventStatus,
} from '~/data/events'
import { deleteEvent, getEventBySlug, updateEvent } from '~/lib/event.functions'
import { seo } from '~/utils/seo'
import { DashboardFormSkeleton } from '~/components/page-skeletons'

const statusOptions: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]

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

function parseIsoDate(value?: string) {
  if (!value) return undefined
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function asTimezone(value?: string): TimezoneOption {
  if (value === 'GMT+7' || value === 'GMT+8' || value === 'GMT+9') return value
  return 'GMT+8'
}

export const Route = createFileRoute('/dashboard/events/$slug/edit')({
  pendingComponent: DashboardFormSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const event = await getEventBySlug({
      data: { slug: params.slug, includeDraft: true },
    })
    if (!event?.id) {
      throw notFound()
    }
    return { event }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `Edit ${loaderData.event.name} · Dashboard | Barong Cycling Team`,
          description: loaderData.event.blurb,
        })
      : undefined,
  }),
  component: DashboardEditEventPage,
})

function DashboardEditEventPage() {
  const { event } = Route.useLoaderData()
  const navigate = useNavigate()

  const [name, setName] = React.useState(event.name)
  const [slug, setSlug] = React.useState(event.slug)
  const [slugEdited, setSlugEdited] = React.useState(true)
  const [date, setDate] = React.useState<Date | undefined>(
    () => parseIsoDate(event.eventDate),
  )
  const [dateOpen, setDateOpen] = React.useState(false)
  const [time, setTime] = React.useState(event.eventTime || '05:30')
  const [timezone, setTimezone] = React.useState<TimezoneOption>(
    asTimezone(event.timeZone),
  )
  const [registrationClosesAt, setRegistrationClosesAt] = React.useState<
    Date | undefined
  >(() => parseIsoDate(event.registrationClosesAt))
  const [registrationClosesOpen, setRegistrationClosesOpen] =
    React.useState(false)
  const [location, setLocation] = React.useState(event.location)
  const [locationAddress, setLocationAddress] = React.useState(
    event.locationAddress ?? '',
  )
  const [status, setStatus] = React.useState<EventStatus>(event.status)
  const [kind, setKind] = React.useState<EventKind>(event.kind)
  const [requireJersey, setRequireJersey] = React.useState(
    Boolean(event.hasJersey),
  )
  const [requireGroup, setRequireGroup] = React.useState(
    Boolean(event.isGroupRide),
  )
  const [groupCapacity, setGroupCapacity] = React.useState(
    String(event.groupCapacity ?? 8),
  )
  const [description, setDescription] = React.useState(event.description)
  const [regulation, setRegulation] = React.useState(event.regulation ?? '')
  const [featureImage, setFeatureImage] = React.useState(
    event.featureImage?.trim() || '',
  )
  const [featureImageAlt, setFeatureImageAlt] = React.useState(
    event.featureImage?.trim() ? event.imageAlt : '',
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  async function onSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    if (!event.id) return
    if (!date) {
      setSubmitError('Pick an event date.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const updated = await updateEvent({
        data: {
          id: event.id,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          regulation: regulation.trim() || undefined,
          featureImage: featureImage.trim() || undefined,
          featureImageAlt: featureImageAlt.trim() || undefined,
          kind,
          status,
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
        params: { slug: updated.slug },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update event.',
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  render={
                    <Link
                      params={{ slug: event.slug }}
                      to="/dashboard/events/$slug"
                    />
                  }
                >
                  {event.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Edit event
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update details and publishing status.
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
                  onBlur={() => setSlug((current) => slugify(current))}
                  onChange={(e) => {
                    setSlugEdited(true)
                    setSlug(slugifyInput(e.target.value))
                  }}
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
                        disabled={[...(date ? [{ after: date }] : [])]}
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
              description="Draft stays hidden. Open publishes it. Closed ends registration."
              title="Publishing"
            >
              <Field>
                <FieldLabel>Status</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      className={cn(
                        'border px-3 py-2 text-sm font-medium transition-colors',
                        status === option.value
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border hover:border-foreground/40',
                      )}
                      key={option.value}
                      onClick={() => setStatus(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>
            </FormSection>

            <FormSection
              description="Free, paid, or flagship, plus optional registration steps. Categories are managed on the category page."
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
                    Riders must create or join a group before completing
                    registration.
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
                  params={{ slug: event.slug }}
                  to="/dashboard/events/$slug"
                >
                  Cancel
                </Link>
                <Button disabled={submitting} type="submit">
                  {submitting ? (<><Spinner /> Saving…</>) : 'Save changes'}
                </Button>
              </div>
            </div>
          </form>

          <DeleteEventCard
            eventId={event.id!}
            eventName={event.name}
          />
      </div>
    </>
  )
}

function DeleteEventCard({
  eventId,
  eventName,
}: {
  eventId: string
  eventName: string
}) {
  const navigate = useNavigate()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteEvent({ data: { id: eventId } })
      await router.invalidate()
      toast.add({ type: 'success', title: 'Event deleted' })
      void navigate({ to: '/dashboard/events' })
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'Could not delete event',
      })
      setDeleting(false)
    }
  }

  return (
    <section className="grid gap-6 border-t border-border py-8 md:grid-cols-3">
      <div>
        <h2 className="text-sm font-semibold text-destructive">Delete event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently remove this event, its categories, groups, and
          participants. This cannot be undone.
        </p>
      </div>
      <div className="md:col-span-2">
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger
            render={<Button type="button" variant="destructive" />}
          >
            Delete event
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {eventName}?</DialogTitle>
              <DialogDescription>
                This permanently deletes the event and related registration
                data. You cannot recover it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                disabled={deleting}
                onClick={() => void confirmDelete()}
                type="button"
                variant="destructive"
              >
                {deleting ? (<><Spinner /> Deleting…</>) : 'Delete permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
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

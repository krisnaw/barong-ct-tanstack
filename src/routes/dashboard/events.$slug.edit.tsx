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
import {
  type EventKind,
  type EventStatus,
  eventImageSrc,
  registerCtaCopy,
} from '~/data/events'
import { deleteEvent, getEventBySlug, updateEvent } from '~/lib/event.functions'
import { seo } from '~/utils/seo'
import { DashboardFormSkeleton } from '~/components/page-skeletons'

const statusOptions: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
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
  const primaryCourse = event.courses?.[0]

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
  const [categoryName, setCategoryName] = React.useState(
    event.categoryName || primaryCourse?.name || event.name,
  )
  const [categoryNameEdited, setCategoryNameEdited] = React.useState(true)
  const [distance, setDistance] = React.useState(
    primaryCourse?.distance || event.distance || '',
  )
  const [price, setPrice] = React.useState(String(event.feeAmount ?? 0))
  const [serviceFee, setServiceFee] = React.useState(
    String(event.serviceFeeAmount ?? 0),
  )
  const [slots, setSlots] = React.useState(event.capacity ?? '')
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

  const isFree = kind === 'free'
  const priceAmount = Number(price.replace(/\D/g, '') || 0)
  const serviceFeeAmount = Number(serviceFee.replace(/\D/g, '') || 0)
  const displayPrice = isFree
    ? 'Free'
    : price.trim()
      ? `Rp ${priceAmount.toLocaleString('id-ID')}`
      : undefined

  function applyEventType(nextKind: EventKind) {
    setKind(nextKind)
    if (nextKind === 'free') {
      setPrice('0')
      setServiceFee('0')
      setCategoryNameEdited(false)
      setCategoryName(name.trim())
      return
    }
    if (priceAmount === 0) setPrice('')
  }

  async function onSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    if (!event.id) return
    if (!date) {
      setSubmitError('Pick an event date.')
      return
    }
    if (!isFree && priceAmount <= 0) {
      setSubmitError('Paid and flagship events need a price greater than 0.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const slotsValue = slots.replace(/\D/g, '')
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
          category: {
            id: event.categoryId || primaryCourse?.id,
            name: (categoryName.trim() || name.trim() || 'Open').trim(),
            distance: distance.trim(),
            price: isFree ? 0 : priceAmount,
            serviceFee: isFree ? 0 : serviceFeeAmount,
            maxParticipants: slotsValue ? Number(slotsValue) : null,
          },
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
            Update details, category, and publishing status.
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,40rem)_minmax(20rem,1fr)]">
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
                    if (isFree && !categoryNameEdited) {
                      setCategoryName(nextName.trim())
                    }
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

              <div className="grid gap-5 sm:grid-cols-2">
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
              </div>

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
                        className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground sm:max-w-xs"
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
              description={
                isFree
                  ? 'Free auto-fills category name and sets price to 0 — edit freely. Leave slots empty for unlimited.'
                  : 'Update the default category. Extra flagship courses stay as-is for now.'
              }
              title="Type & Category"
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
                      onClick={() => applyEventType(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="categoryName">Category name</FieldLabel>
                <Input
                  id="categoryName"
                  onChange={(e) => {
                    setCategoryNameEdited(true)
                    setCategoryName(e.target.value)
                  }}
                  placeholder={name.trim() || 'Open'}
                  required
                  value={categoryName}
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
                  <FieldLabel htmlFor="slots">Slots / limit</FieldLabel>
                  <Input
                    id="slots"
                    inputMode="numeric"
                    onChange={(e) => setSlots(e.target.value)}
                    placeholder="Unlimited"
                    value={slots}
                  />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="price">Price</FieldLabel>
                  <Input
                    aria-invalid={!isFree && priceAmount <= 0}
                    id="price"
                    inputMode="numeric"
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={isFree ? '0' : '150000'}
                    required
                    value={price}
                  />
                  {!isFree ? (
                    <FieldDescription>Must be greater than 0.</FieldDescription>
                  ) : (
                    <FieldDescription>
                      Defaults to 0 for free events.
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="serviceFee">Service fee</FieldLabel>
                  <Input
                    id="serviceFee"
                    inputMode="numeric"
                    onChange={(e) => setServiceFee(e.target.value)}
                    placeholder="0"
                    value={serviceFee}
                  />
                  <FieldDescription>Optional. Can be 0.</FieldDescription>
                </Field>
              </div>
            </FormSection>

            <FormSection
              description="Optional registration steps. Turn these on only when the event needs them."
              title="Options"
            >
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
                <textarea
                  className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What riders should know before joining."
                  required
                  value={description}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="regulation">Regulation</FieldLabel>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="regulation"
                  onChange={(e) => setRegulation(e.target.value)}
                  placeholder="Optional rules, cut-offs, and kit requirements."
                  value={regulation}
                />
              </Field>
            </FormSection>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-8">
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
          </form>

          <EventPreview
            categoryName={categoryName}
            date={date ? format(date, 'd MMMM yyyy') : ''}
            description={description}
            distance={distance}
            featureImage={featureImage}
            fee={displayPrice}
            groupCapacity={requireGroup ? groupCapacity : undefined}
            kind={kind}
            location={location}
            locationAddress={locationAddress}
            name={name}
            registrationClosesAt={
              registrationClosesAt
                ? format(registrationClosesAt, 'd MMMM yyyy')
                : ''
            }
            regulation={regulation}
            requireGroup={requireGroup}
            requireJersey={requireJersey}
            serviceFee={isFree ? undefined : serviceFee}
            slug={slug}
            slots={slots}
            status={status}
            time={time}
            timezone={timezone}
          />
        </div>

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
    <section className="border border-destructive/25 bg-destructive/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold tracking-tight text-destructive">
            Delete event
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Permanently remove this event, its categories, groups, and
            participants. This cannot be undone.
          </p>
        </div>
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger
            render={
              <Button className="shrink-0" type="button" variant="destructive" />
            }
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
    <section className="border-t border-border py-8">
      <div>
        <h2 className="font-heading text-base font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <FieldGroup className="mt-6">{children}</FieldGroup>
    </section>
  )
}

const previewStatusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
}

const previewStatusStyles: Record<EventStatus, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

const eventTypeLabel: Record<EventKind, string> = {
  free: 'Free',
  paid: 'Paid',
  flagship: 'Flagship',
}

function EventPreview({
  categoryName,
  date,
  description,
  distance,
  featureImage,
  fee,
  groupCapacity,
  kind,
  location,
  locationAddress,
  name,
  registrationClosesAt,
  regulation,
  requireGroup,
  requireJersey,
  serviceFee,
  slug,
  slots,
  status,
  time,
  timezone,
}: {
  categoryName?: string
  date: string
  description: string
  distance?: string
  featureImage?: string
  fee?: string
  groupCapacity?: string
  kind: EventKind
  location: string
  locationAddress?: string
  name: string
  registrationClosesAt: string
  regulation: string
  requireGroup: boolean
  requireJersey: boolean
  serviceFee?: string
  slug: string
  slots?: string
  status: EventStatus
  time: string
  timezone: TimezoneOption
}) {
  const displayName = name.trim() || 'Event name'
  const displayFee = fee?.trim() || (kind === 'free' ? 'Free' : 'Price')
  const displayDistance = distance?.trim() || 'Distance'
  const displaySlots = slots?.trim() ? `${slots.trim()} spots` : 'Unlimited'
  const displayCategory = categoryName?.trim() || 'Category'
  const displayServiceFee = serviceFee?.trim()
    ? `Rp ${Number(serviceFee.replace(/\D/g, '') || 0).toLocaleString('id-ID')}`
    : null
  const canRegister = status === 'open'

  return (
    <aside className="space-y-4 border-t border-border py-8 lg:sticky lg:top-6">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Preview
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === 'draft'
            ? 'Hidden from the public calendar until Open.'
            : status === 'closed'
              ? 'Registration is closed.'
              : 'How this event appears on the ride calendar.'}
        </p>
      </div>

      <div className="border border-border p-5">
        {featureImage?.trim() ? (
          <img
            alt=""
            className="mb-4 aspect-[16/10] w-full object-cover"
            decoding="async"
            height={400}
            src={eventImageSrc(featureImage.trim(), 800)}
            width={800}
          />
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Event
            </p>
            <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">
              {displayName}
            </h3>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
              previewStatusStyles[status],
            )}
          >
            {previewStatusLabel[status]}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description.trim() || 'Longer details for the event page.'}
        </p>
        {regulation.trim() ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Regulation
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {regulation.trim()}
            </p>
          </div>
        ) : null}

        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <PreviewRow
            label="When"
            value={
              date.trim()
                ? `${date}${
                    time.trim()
                      ? ` · ${time.trim()} ${timezone}`
                      : ` · ${timezone}`
                  }`
                : '—'
            }
          />
          <PreviewRow label="Location" value={location.trim() || '—'} />
          {locationAddress?.trim() ? (
            <PreviewRow label="Address" value={locationAddress.trim()} />
          ) : null}
          <PreviewRow
            label="Reg. closes"
            value={registrationClosesAt.trim() || '—'}
          />
          <PreviewRow label="URL" value={slug ? `/events/${slug}` : '—'} />
          <PreviewRow
            label="Jersey"
            value={requireJersey ? 'Required' : 'Off'}
          />
          <PreviewRow
            label="Group"
            value={
              requireGroup
                ? groupCapacity?.trim()
                  ? `Required · max ${groupCapacity.trim()}`
                  : 'Required'
                : 'Off'
            }
          />
        </dl>

        <span
          className={cn(
            buttonVariants(),
            'mt-6 w-full pointer-events-none',
            !canRegister && 'opacity-50',
          )}
        >
          {canRegister ? 'Register' : 'Not available yet'}
        </span>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {canRegister
            ? registerCtaCopy(kind)
            : 'Check back later or browse other open events.'}
        </p>
      </div>

      <div className="border border-border p-5">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Category
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <h4 className="font-heading text-lg font-semibold tracking-tight">
            {displayCategory}
          </h4>
          <p className="shrink-0 text-sm font-medium tabular-nums">
            {displayFee}
          </p>
        </div>

        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <PreviewRow label="Type" value={eventTypeLabel[kind]} />
          <PreviewRow label="Distance" value={displayDistance} />
          <PreviewRow label="Slots" value={displaySlots} />
          <PreviewRow label="Price" value={displayFee} />
          {displayServiceFee ? (
            <PreviewRow label="Service fee" value={displayServiceFee} />
          ) : null}
        </dl>
      </div>
    </aside>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

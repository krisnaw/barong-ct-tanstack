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
import { type EventKind, type EventStatus, eventImageSrc, registerCtaCopy } from '~/data/events'
import { EventFeatureImageField } from '~/components/event-feature-image-field'
import { HtmlContent } from '~/components/html-content'
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
  const [categoryName, setCategoryName] = React.useState('')
  const [categoryNameEdited, setCategoryNameEdited] = React.useState(false)
  const [distance, setDistance] = React.useState('')
  const [price, setPrice] = React.useState('0')
  const [serviceFee, setServiceFee] = React.useState('0')
  const [slots, setSlots] = React.useState('')
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
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
          category: {
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
            description={
              isFree
                ? 'Free auto-fills category name and sets price to 0 — edit freely. Leave slots empty for unlimited.'
                : 'Pick the type, then set the default category. Paid and Flagship need a price; service fee can stay 0.'
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
              {isFree ? (
                <FieldDescription>
                  Auto-filled from the event name until you edit it.
                </FieldDescription>
              ) : null}
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
                  <FieldDescription>Defaults to 0 for free events.</FieldDescription>
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

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-8">
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
            status="draft"
            time={time}
            timezone={timezone}
          />
        </div>
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
  archived: 'Archived',
}

const previewStatusStyles: Record<EventStatus, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-zinc-200 bg-zinc-100 text-zinc-600',
  archived: 'border-amber-200 bg-amber-50 text-amber-900',
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
  status: Extract<EventStatus, 'draft' | 'open'>
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
            : 'How this event appears on the ride calendar.'}
        </p>
      </div>

      <div className="border border-border p-5">
        {featureImage?.trim() ? (
          <img
            alt=""
            className="mb-4 aspect-[4/5] w-full object-cover"
            decoding="async"
            height={1000}
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

        <div className="mt-3">
          {description.trim() ? (
            <HtmlContent className="text-sm" html={description} />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Longer details for the event page.
            </p>
          )}
        </div>
        {regulation.trim() ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Regulation
            </p>
            <HtmlContent className="mt-2 text-sm" html={regulation} />
          </div>
        ) : null}

        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <PreviewRow
            label="When"
            value={
              date.trim()
                ? `${date}${
                    time.trim() ? ` · ${time.trim()} ${timezone}` : ` · ${timezone}`
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
          <PreviewRow
            label="URL"
            value={slug ? `/events/${slug}` : '—'}
          />
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
          <p className="shrink-0 text-sm font-medium tabular-nums">{displayFee}</p>
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

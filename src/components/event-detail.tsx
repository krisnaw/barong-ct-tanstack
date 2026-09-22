import * as React from 'react'
import {
  CalendarBlankIcon,
  CopyIcon,
  MapPinIcon,
  PathIcon,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import {
  type ClubEvent,
  type EventStatus,
  eventImageSrc,
  firstStepForKind,
  formatIdr,
  registerCtaCopy,
} from '~/data/events'
import {
  hasRegisterProgress,
  invitePath,
  clearDraft,
  emptyDraft,
  loadDraft,
  nextFlagshipStep,
  type RegisterDraft,
} from '~/lib/event-register-draft'
import type { MyEventRegistration } from '~/lib/event.functions'
import { Button, buttonVariants } from '~/components/ui/button'
import { HtmlContent } from '~/components/html-content'
import { cn } from '~/lib/utils'

const statusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  open: 'Registration open',
  closed: 'Registration closed',
  archived: 'Archived',
}

export function EventDetail({
  event,
  registration,
}: {
  event: ClubEvent
  registration: MyEventRegistration | null
}) {
  const canRegister = event.status === 'open'
  const [draft, setDraft] = React.useState<RegisterDraft | null>(null)
  const [copied, setCopied] = React.useState(false)
  const courses = event.courses ?? []
  const hasMultipleCategories = courses.length > 1

  React.useEffect(() => {
    const loaded = loadDraft(event.slug)
    if (
      !registration &&
      (loaded.status === 'confirmed' || loaded.status === 'pending_payment')
    ) {
      clearDraft(event.slug)
      setDraft({
        ...emptyDraft,
        firstName: loaded.firstName,
        lastName: loaded.lastName,
        email: loaded.email,
        phone: loaded.phone,
        gender: loaded.gender,
        bloodType: loaded.bloodType,
        dateOfBirth: loaded.dateOfBirth,
        nationality: loaded.nationality,
        idNumber: loaded.idNumber,
        emergencyContactName: loaded.emergencyContactName,
        emergencyContactPhone: loaded.emergencyContactPhone,
        club: loaded.club,
      })
      return
    }
    if (registration) {
      setDraft({
        ...loaded,
        groupId: registration.groupId ?? loaded.groupId,
        groupName: registration.groupName ?? loaded.groupName,
        status:
          registration.status === 'confirmed'
            ? 'confirmed'
            : registration.status === 'pending_payment'
              ? 'pending_payment'
              : loaded.status,
      })
      return
    }
    setDraft(loaded)
  }, [event.slug, registration])

  const confirmed = registration?.status === 'confirmed'
  const awaitingPayment = registration?.status === 'pending_payment'
  const inProgress = Boolean(
    !confirmed && !awaitingPayment && draft && hasRegisterProgress(draft),
  )
  const continueStep =
    event.kind === 'flagship' && draft
      ? nextFlagshipStep(draft)
      : event.kind === 'paid'
        ? draft?.profileConfirmed
          ? 'payment'
          : 'profile'
        : 'profile'
  const groupId = registration?.groupId || draft?.groupId || ''
  const groupName = registration?.groupName || draft?.groupName || ''
  const shareUrl =
    typeof window !== 'undefined' && groupId
      ? `${window.location.origin}${invitePath(event.slug, groupId)}`
      : ''

  async function copyInvite() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <article>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:px-12 lg:py-12">
        <div>
          <img
            alt={event.imageAlt}
            className="aspect-[4/5] w-full object-cover"
            decoding="async"
            height={1350}
            src={eventImageSrc(event.image, 1080)}
            width={1080}
          />

          <p className="mt-6 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {statusLabel[event.status]}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {event.name}
          </h1>
          <HtmlContent className="mt-3 max-w-2xl" html={event.description} />

          <dl className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
            <Fact
              icon={<CalendarBlankIcon className="size-4" weight="bold" />}
              label="When"
              value={`${event.date} · ${event.time}`}
            />
            <Fact
              icon={<MapPinIcon className="size-4" weight="bold" />}
              label="Start"
              value={event.location}
            />
            {!courses.length ? (
              <Fact
                icon={<PathIcon className="size-4" weight="bold" />}
                label="Distance"
                value={
                  event.elevation
                    ? `${event.distance} · ${event.elevation}`
                    : event.distance
                }
              />
            ) : null}
          </dl>

          {courses.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                {hasMultipleCategories ? 'Categories' : 'Category'}
              </h2>
              <ul className="mt-3 divide-y divide-border border border-border">
                {courses.map((course) => (
                  <li
                    className="flex items-start justify-between gap-4 px-4 py-3"
                    key={course.id}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{course.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {course.distance}
                        {course.elevation ? ` · ${course.elevation}` : ''}
                        {course.maxParticipants != null
                          ? ` · ${course.maxParticipants} spots`
                          : ''}
                      </p>
                      {course.description.trim() ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {course.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">
                      {course.price > 0 ? formatIdr(course.price) : 'Free'}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="h-fit border border-border p-5 sm:p-6 lg:sticky lg:top-6">
          {confirmed ? (
            <p className="border border-border bg-muted/30 px-3 py-2 text-sm">
              You’re registered
              {groupName ? ` with ${groupName}` : ''}.
            </p>
          ) : canRegister ? (
            <Link
              className={cn(buttonVariants(), 'w-full')}
              params={{ slug: event.slug }}
              search={{
                step: awaitingPayment
                  ? 'payment'
                  : inProgress
                    ? continueStep
                    : firstStepForKind(event.kind),
                groupId: groupId || undefined,
              }}
              to="/events/$slug/register"
            >
              {awaitingPayment
                ? 'Complete payment'
                : inProgress
                  ? 'Continue registration'
                  : 'Register'}
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants(),
                'w-full opacity-50 pointer-events-none',
              )}
            >
              {event.status === 'draft'
                ? 'Not available yet'
                : 'Registration closed'}
            </span>
          )}

          {confirmed && event.kind === 'flagship' && groupId && shareUrl ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Group invite
              </p>
              <Button
                className="w-full"
                onClick={() => void copyInvite()}
                type="button"
                variant="outline"
              >
                <CopyIcon className="size-4" weight="bold" />
                {copied ? 'Copied invite link' : 'Copy invite link'}
              </Button>
            </div>
          ) : null}

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {canRegister && !confirmed
              ? awaitingPayment
                ? 'Finish payment to confirm your spot.'
                : registerCtaCopy(event.kind)
              : confirmed
                ? event.kind === 'flagship'
                  ? 'Share the invite so teammates can join your group.'
                  : 'See you at the start.'
                : 'Check back later or browse other open events.'}
          </p>
        </aside>
      </div>
    </article>
  )
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <dt className="text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="mt-1 text-sm font-medium">{value}</dd>
      </div>
    </div>
  )
}

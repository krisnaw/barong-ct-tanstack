import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CreditCardIcon,
  QrCodeIcon,
} from '@phosphor-icons/react'
import {
  ACCOUNT_BLOOD_TYPES,
  ACCOUNT_GENDERS,
} from '~/lib/account'
import {
  type ClubEvent,
  type CourseOption,
  eventEntryAmount,
  formatIdr,
  JERSEY_SIZES,
  type PaymentMethodChoice,
  type RegisterStep,
  stepsForKind,
} from '~/data/events'
import { useAccount } from '~/lib/account'
import {
  applyProfileToDraft,
  emptyDraft,
  findGroup,
  groupNameTaken,
  isProfileComplete,
  loadDraft,
  patchCreatedGroup,
  type RegisterDraft,
  saveCreatedGroup,
  saveDraft,
} from '~/lib/event-register-draft'
import { registerForEvent } from '~/lib/event.functions'
import {
  type UserProfileRow,
  upsertMyProfile,
} from '~/lib/profile.functions'
import { dokuCardServiceFee } from '~/lib/payment/doku-card-fee'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

const stepLabel: Record<RegisterStep, string> = {
  course: 'Course',
  group: 'Group',
  jersey: 'Jersey',
  profile: 'Profile',
  payment: 'Payment',
}

const paymentMethods: {
  id: PaymentMethodChoice
  label: string
  detail: string
  icon: React.ReactNode
}[] = [
  {
    id: 'qris_va',
    label: 'QRIS / BNI VA',
    detail: 'Pay with QRIS or BNI Virtual Account.',
    icon: <QrCodeIcon className="size-4" weight="bold" />,
  },
  {
    id: 'card',
    label: 'Credit card',
    detail: 'Visa, Mastercard, and other cards. A service fee applies.',
    icon: <CreditCardIcon className="size-4" weight="bold" />,
  },
]

const selectClassName =
  'h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function EventRegisterWizard({
  event,
  step,
  groupId,
  profile,
}: {
  event: ClubEvent
  step: RegisterStep
  groupId?: string
  profile: UserProfileRow & { email: string }
}) {
  const navigate = useNavigate()
  const steps = stepsForKind(event.kind)
  const [draft, setDraft] = React.useState<RegisterDraft>(emptyDraft)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const loaded = loadDraft(event.slug)
    const invited = groupId ? findGroup(event.slug, groupId) : undefined
    const withGroup = invited
      ? {
          ...loaded,
          groupId: invited.id,
          groupName: invited.name,
          courseId: invited.courseId,
        }
      : loaded
    const next = applyProfileToDraft(withGroup, profile)
    if (invited) saveDraft(event.slug, next)
    setDraft(next)
    setReady(true)
  }, [event.slug, groupId, profile])

  function update(partial: Partial<RegisterDraft>) {
    setDraft((current) => {
      const next = { ...current, ...partial }
      saveDraft(event.slug, next)
      return next
    })
  }

  function goTo(nextStep: RegisterStep, createdGroupId?: string) {
    void navigate({
      to: '/events/$slug/register',
      params: { slug: event.slug },
      search: {
        step: nextStep,
        groupId: createdGroupId || groupId || draft.groupId || undefined,
      },
    })
  }

  const invited = Boolean(groupId && draft.groupId === groupId)
  const stepIndex = Math.max(0, steps.indexOf(step))

  React.useEffect(() => {
    if (!ready || event.kind !== 'flagship') return
    if (invited && step === 'group') {
      void navigate({
        to: '/events/$slug/register',
        params: { slug: event.slug },
        search: { step: 'course', groupId },
        replace: true,
      })
      return
    }
    if ((step === 'course' || step === 'jersey') && !draft.groupId) {
      void navigate({
        to: '/events/$slug/register',
        params: { slug: event.slug },
        search: { step: 'group', groupId: groupId || undefined },
        replace: true,
      })
      return
    }
    if (step === 'jersey' && !draft.courseId) {
      void navigate({
        to: '/events/$slug/register',
        params: { slug: event.slug },
        search: { step: 'course', groupId: groupId || draft.groupId || undefined },
        replace: true,
      })
    }
  }, [
    draft.courseId,
    draft.groupId,
    event.kind,
    event.slug,
    groupId,
    invited,
    navigate,
    ready,
    step,
  ])

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10 lg:px-0 lg:py-12">
        <p className="text-sm text-muted-foreground">Loading registration…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10 lg:px-0 lg:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Register
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {event.name}
          </h1>
        </div>
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          params={{ slug: event.slug }}
          to="/events/$slug"
        >
          Back to event
        </Link>
      </div>

      {steps.length > 1 ? (
        <ol className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {steps.map((item, index) => {
            const active = item === step
            const done = index < stepIndex
            return (
              <li key={item}>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium tracking-[0.12em] uppercase',
                    active && 'bg-foreground text-background',
                    done && !active && 'text-foreground',
                    !active && !done && 'text-muted-foreground',
                  )}
                >
                  <span className="tabular-nums">{index + 1}</span>
                  {stepLabel[item]}
                </span>
              </li>
            )
          })}
        </ol>
      ) : null}

      {event.kind === 'flagship' && step === 'group' ? (
        <GroupStep
          draft={draft}
          event={event}
          invited={invited}
          onContinue={(createdId) => goTo('course', createdId)}
          onUpdate={update}
        />
      ) : null}

      {event.kind === 'flagship' && step === 'course' ? (
        <CourseStep
          courses={event.courses ?? []}
          draft={draft}
          eventSlug={event.slug}
          onBack={() => goTo('group')}
          onContinue={() => goTo('jersey')}
          onUpdate={update}
        />
      ) : null}

      {event.kind === 'flagship' && step === 'jersey' ? (
        <JerseyStep
          draft={draft}
          onBack={() => goTo('course')}
          onContinue={() => goTo('profile')}
          onUpdate={update}
          preferredSize={profile.jerseySize}
        />
      ) : null}

      {step === 'profile' ? (
        <ProfileStep
          confirmLabel={event.kind === 'free' ? 'Join event' : 'Continue'}
          draft={draft}
          onBack={
            event.kind === 'flagship' ? () => goTo('jersey') : undefined
          }
          onContinue={async () => {
            if (event.kind === 'free') {
              await registerForEvent({
                data: {
                  eventSlug: event.slug,
                  categoryId: event.courses?.[0]?.id,
                  status: 'confirmed',
                },
              })
              const next = {
                ...draft,
                profileConfirmed: true,
                status: 'confirmed' as const,
              }
              saveDraft(event.slug, next)
              setDraft(next)
              void navigate({
                to: '/events/$slug',
                params: { slug: event.slug },
              })
              return
            }
            goTo('payment')
          }}
          onUpdate={update}
        />
      ) : null}

      {step === 'payment' ? (
        <PaymentStep
          draft={draft}
          event={event}
          onBack={() => goTo('profile')}
          onPaid={async () => {
            await registerForEvent({
              data: {
                eventSlug: event.slug,
                categoryId: draft.courseId || event.courses?.[0]?.id,
                groupId: draft.groupId || undefined,
                groupName: draft.groupName || undefined,
                jerseySize: draft.jerseySize || undefined,
                status: 'confirmed',
              },
            })
            const next = { ...draft, status: 'confirmed' as const }
            saveDraft(event.slug, next)
            setDraft(next)
            void navigate({
              to: '/events/$slug',
              params: { slug: event.slug },
            })
          }}
          onUpdate={update}
        />
      ) : null}
    </div>
  )
}

function CourseStep({
  courses,
  draft,
  eventSlug,
  onUpdate,
  onBack,
  onContinue,
}: {
  courses: CourseOption[]
  draft: RegisterDraft
  eventSlug: string
  onUpdate: (partial: Partial<RegisterDraft>) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Choose your course
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Same start. Pick the distance that fits your day.
        </p>
      </div>

      <div className="grid gap-3">
        {courses.map((course) => {
          const active = draft.courseId === course.id
          return (
            <button
              className={cn(
                'border p-4 text-left transition-colors',
                active
                  ? 'border-foreground bg-muted/40'
                  : 'border-border hover:border-foreground/40',
              )}
              key={course.id}
              onClick={() => {
                onUpdate({ courseId: course.id })
                if (draft.groupId) {
                  patchCreatedGroup(eventSlug, draft.groupId, {
                    courseId: course.id,
                  })
                }
              }}
              type="button"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{course.name}</p>
                <p className="text-sm font-medium tabular-nums">
                  {formatIdr(course.price)}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.distance}
                {course.elevation ? ` · ${course.elevation}` : ''}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button disabled={!draft.courseId} onClick={onContinue} type="button">
          Continue to jersey
        </Button>
      </div>
    </section>
  )
}

function GroupStep({
  event,
  draft,
  invited,
  onUpdate,
  onContinue,
}: {
  event: ClubEvent
  draft: RegisterDraft
  invited: boolean
  onUpdate: (partial: Partial<RegisterDraft>) => void
  onContinue: (createdGroupId?: string) => void
}) {
  const [name, setName] = React.useState(draft.groupName)
  const [error, setError] = React.useState('')
  const created = Boolean(draft.groupId)
  const group = draft.groupId ? findGroup(event.slug, draft.groupId) : undefined
  const full =
    Boolean(group && event.groupCapacity) &&
    (group?.memberCount ?? 0) >= (event.groupCapacity ?? 0)

  function createGroup() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a group name.')
      return null
    }
    if (groupNameTaken(event.slug, trimmed)) {
      setError(`“${trimmed}” already exists. Try adding a number, e.g. ${trimmed} 1.`)
      return null
    }
    const groupId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `grp-${Date.now()}`
    saveCreatedGroup({
      id: groupId,
      eventSlug: event.slug,
      courseId: draft.courseId,
      name: trimmed,
      memberCount: 1,
    })
    onUpdate({ groupId, groupName: trimmed })
    setError('')
    return groupId
  }

  function handleContinue() {
    if (draft.groupId) {
      onContinue()
      return
    }
    const createdId = createGroup()
    if (createdId) onContinue(createdId)
  }

  if (invited && full) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            This group is full
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {draft.groupName || 'This group'} already has {event.groupCapacity}{' '}
            riders. Ask for a new invite or create your own group.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {invited ? 'Join this group' : 'Create a group ride'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {invited
            ? `You were invited to ${draft.groupName}. Pick your course next.`
            : `Name your peloton. You can invite teammates after registration is complete. Up to ${event.groupCapacity ?? 8} riders.`}
        </p>
      </div>

      {invited || created ? (
        <div className="border border-border p-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Group
          </p>
          <p className="mt-1 font-medium">{draft.groupName}</p>
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="groupName">Group name</FieldLabel>
          <Input
            id="groupName"
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder="Kopi Peloton"
            value={name}
          />
          {error ? (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          ) : (
            <FieldDescription>
              Names must be unique for this event.
            </FieldDescription>
          )}
        </Field>
      )}

      <div className="flex justify-end">
        <Button
          disabled={invited ? !draft.groupId : !name.trim() && !draft.groupId}
          onClick={handleContinue}
          type="button"
        >
          Continue to course
        </Button>
      </div>
    </section>
  )
}

function JerseyStep({
  draft,
  onUpdate,
  onBack,
  onContinue,
  preferredSize,
}: {
  draft: RegisterDraft
  onUpdate: (partial: Partial<RegisterDraft>) => void
  onBack: () => void
  onContinue: () => void
  preferredSize?: string
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Jersey size
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Race-fit kit is included. If you sit between sizes, take the larger for
          Bali heat.
        </p>
      </div>

      <Field>
        <FieldLabel>Size</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {JERSEY_SIZES.map((size) => {
            const active = draft.jerseySize === size
            return (
              <button
                className={cn(
                  'min-w-12 border px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:border-foreground/40',
                )}
                key={size}
                onClick={() => onUpdate({ jerseySize: size })}
                type="button"
              >
                {size}
            </button>
          )
        })}
        </div>
        {preferredSize ? (
          <FieldDescription>
            Your account default is {preferredSize}. Confirm a size for this
            event.
          </FieldDescription>
        ) : null}
      </Field>

      <div className="flex items-center justify-between gap-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button
          disabled={!draft.jerseySize}
          onClick={onContinue}
          type="button"
        >
          Continue to profile
        </Button>
      </div>
    </section>
  )
}

function ProfileStep({
  draft,
  confirmLabel = 'Continue',
  onUpdate,
  onBack,
  onContinue,
}: {
  draft: RegisterDraft
  confirmLabel?: string
  onUpdate: (partial: Partial<RegisterDraft>) => void
  onBack?: () => void
  onContinue: () => void | Promise<void>
}) {
  const { signedIn, updateProfile } = useAccount()
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleContinue() {
    if (!isProfileComplete(draft) || saving) return
    setSaving(true)
    setError('')
    const patch = {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      phone: draft.phone.trim(),
      gender: draft.gender,
      bloodType: draft.bloodType,
      dateOfBirth: draft.dateOfBirth,
      nationality: draft.nationality.trim(),
      idNumber: draft.idNumber.trim(),
      emergencyContactName: draft.emergencyContactName.trim(),
      emergencyContactPhone: draft.emergencyContactPhone.trim(),
      ...(draft.jerseySize ? { jerseySize: draft.jerseySize } : {}),
    }
    try {
      if (signedIn) {
        await updateProfile(patch)
      } else {
        await upsertMyProfile({ data: patch })
      }
      onUpdate({ profileConfirmed: true })
      try {
        await onContinue()
      } catch {
        setError('Could not complete registration. Try again.')
      }
    } catch {
      setError('Could not save your profile. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Rider profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Loaded from your account. Changes here update your Barong profile.
        </p>
      </div>

      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input
              id="firstName"
              onChange={(event) => onUpdate({ firstName: event.target.value })}
              required
              value={draft.firstName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input
              id="lastName"
              onChange={(event) => onUpdate({ lastName: event.target.value })}
              required
              value={draft.lastName}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            readOnly
            required
            type="email"
            value={draft.email}
          />
          <FieldDescription>
            From your account. Change it from Account settings.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone / WhatsApp</FieldLabel>
          <Input
            id="phone"
            onChange={(event) => onUpdate({ phone: event.target.value })}
            required
            value={draft.phone}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="gender">Gender</FieldLabel>
            <select
              className={selectClassName}
              id="gender"
              onChange={(event) => onUpdate({ gender: event.target.value })}
              required
              value={draft.gender}
            >
              <option value="">Select</option>
              {ACCOUNT_GENDERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="bloodType">Blood type</FieldLabel>
            <select
              className={selectClassName}
              id="bloodType"
              onChange={(event) => onUpdate({ bloodType: event.target.value })}
              required
              value={draft.bloodType}
            >
              <option value="">Select</option>
              {ACCOUNT_BLOOD_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="dateOfBirth">Date of birth</FieldLabel>
            <Input
              id="dateOfBirth"
              onChange={(event) =>
                onUpdate({ dateOfBirth: event.target.value })
              }
              required
              type="date"
              value={draft.dateOfBirth}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
            <Input
              id="nationality"
              onChange={(event) =>
                onUpdate({ nationality: event.target.value })
              }
              required
              value={draft.nationality}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="idNumber">KTP or ID</FieldLabel>
          <Input
            id="idNumber"
            onChange={(event) => onUpdate({ idNumber: event.target.value })}
            required
            value={draft.idNumber}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="emergencyContactName">
              Emergency contact
            </FieldLabel>
            <Input
              id="emergencyContactName"
              onChange={(event) =>
                onUpdate({ emergencyContactName: event.target.value })
              }
              required
              value={draft.emergencyContactName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="emergencyContactPhone">
              Emergency phone
            </FieldLabel>
            <Input
              id="emergencyContactPhone"
              onChange={(event) =>
                onUpdate({ emergencyContactPhone: event.target.value })
              }
              required
              value={draft.emergencyContactPhone}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="club">Club (optional)</FieldLabel>
          <Input
            id="club"
            onChange={(event) => onUpdate({ club: event.target.value })}
            placeholder="Barong Cycling Team"
            value={draft.club}
          />
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <Button onClick={onBack} type="button" variant="outline">
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button
          disabled={!isProfileComplete(draft) || saving}
          onClick={() => {
            void handleContinue()
          }}
          type="button"
        >
          {saving ? 'Saving…' : confirmLabel}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  )
}

function PaymentStep({
  event,
  draft,
  onBack,
  onPaid,
  onUpdate,
}: {
  event: ClubEvent
  draft: RegisterDraft
  onBack: () => void
  onPaid: () => void | Promise<void>
  onUpdate: (partial: Partial<RegisterDraft>) => void
}) {
  const course = event.courses?.find((item) => item.id === draft.courseId)
  const amount = eventEntryAmount(event, draft.courseId)
  const serviceFee =
    draft.paymentMethod === 'card' ? dokuCardServiceFee(amount) : 0
  const total = amount + serviceFee
  const [paying, setPaying] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handlePay() {
    if (!draft.paymentMethod || paying) return
    setPaying(true)
    setError('')
    try {
      await onPaid()
    } catch {
      setError('Could not complete registration. Try again.')
      setPaying(false)
    }
  }
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Payment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your entry, then pay to confirm the spot.
        </p>
      </div>

      <dl className="divide-y divide-border border border-border text-sm">
        <SummaryRow
          label="Rider"
          value={`${draft.firstName} ${draft.lastName}`.trim() || '—'}
        />
        <SummaryRow label="Email" value={draft.email || '—'} />
        {event.kind === 'flagship' ? (
          <>
            <SummaryRow
              label="Course"
              value={
                course ? `${course.name} (${course.distance})` : '—'
              }
            />
            <SummaryRow label="Group" value={draft.groupName || '—'} />
            <SummaryRow label="Jersey" value={draft.jerseySize || '—'} />
          </>
        ) : null}
        <SummaryRow label="Entry" value={formatIdr(amount)} />
        {serviceFee > 0 ? (
          <SummaryRow label="Card fee" value={formatIdr(serviceFee)} />
        ) : null}
        <SummaryRow label="Total" value={formatIdr(total)} />
      </dl>

      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const active = draft.paymentMethod === method.id
          return (
            <button
              className={cn(
                'flex items-start gap-3 border p-4 text-left transition-colors',
                active
                  ? 'border-foreground bg-muted/40'
                  : 'border-border hover:border-foreground/40',
              )}
              key={method.id}
              onClick={() => onUpdate({ paymentMethod: method.id })}
              type="button"
            >
              <span className="mt-0.5 text-muted-foreground">{method.icon}</span>
              <span>
                <span className="block font-medium">{method.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {method.detail}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Payment is stubbed for now — click pay to finish this draft flow.
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button
          disabled={!draft.paymentMethod || paying}
          onClick={() => {
            void handlePay()
          }}
          type="button"
        >
          {paying ? 'Confirming…' : `Pay ${formatIdr(total)}`}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { CreditCardIcon, HeartIcon, QrCodeIcon } from '@phosphor-icons/react'
import { HtmlContent } from '~/components/html-content'
import { Button } from '~/components/ui/button'
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { toast } from '~/components/ui/toast'
import {
  type ClubEvent,
  eventEntryAmount,
  formatIdr,
  JERSEY_SIZES,
  type PaymentMethodChoice,
  type RegisterStep,
  stepsForEvent,
} from '~/data/events'
import {
  adminRegisterUserForEvent,
  listEventGroups,
  validateEventPromo,
} from '~/lib/event.functions'
import { startEventPayment } from '~/lib/payment.functions'
import { listUsers, type AdminUserListItem } from '~/lib/user.functions'
import { cn } from '~/lib/utils'

type AdminStep = 'user' | Exclude<RegisterStep, 'profile'>

type RegistrationRef = {
  email: string
  status: string
  groupName: string | null
}

const stepLabel: Record<AdminStep, string> = {
  user: 'User',
  group: 'Group',
  course: 'Course',
  jersey: 'Jersey',
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
    detail: 'Visa, Mastercard, and other cards via DOKU.',
    icon: <CreditCardIcon className="size-4" weight="bold" />,
  },
]

const DONATION_PRESETS = [50_000, 100_000, 250_000, 500_000] as const

function adminSteps(event: Pick<ClubEvent, 'kind' | 'hasJersey'>): AdminStep[] {
  return [
    'user',
    ...stepsForEvent(event).filter((step) => step !== 'profile'),
  ]
}

function isJerseySize(value: string): value is (typeof JERSEY_SIZES)[number] {
  return (JERSEY_SIZES as readonly string[]).includes(value)
}

function registrationQuote(
  event: ClubEvent,
  courseId: string,
  discount: number,
  donationAmount: number,
) {
  const course = event.courses?.find((item) => item.id === courseId)
  const amount = eventEntryAmount(event, courseId)
  const serviceFee =
    event.kind === 'flagship'
      ? (course?.serviceFee ?? 0)
      : (event.serviceFeeAmount ?? 0)
  const donation = event.hasCharity
    ? Math.max(0, Math.round(donationAmount || 0))
    : 0
  const discountAmount = Math.max(0, discount || 0)
  const total = Math.max(0, amount + serviceFee - discountAmount + donation)
  return { course, amount, serviceFee, donation, discountAmount, total }
}

export function RegisterEventUserDialog({
  event,
  registrations,
}: {
  event: ClubEvent
  registrations: RegistrationRef[]
}) {
  const router = useRouter()
  const searchId = React.useId()
  const steps = adminSteps(event)
  const courses = event.courses ?? []
  const courseKey = courses.map((course) => course.id).join('\0')
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<AdminStep>('user')
  const [query, setQuery] = React.useState('')
  const [users, setUsers] = React.useState<AdminUserListItem[]>([])
  const [groups, setGroups] = React.useState<Array<{ id: string; name: string }>>(
    [],
  )
  const [loadingUsers, setLoadingUsers] = React.useState(false)
  const [loadingGroups, setLoadingGroups] = React.useState(false)
  const [selected, setSelected] = React.useState<AdminUserListItem | null>(null)
  const [groupName, setGroupName] = React.useState('')
  const [groupError, setGroupError] = React.useState('')
  const [courseId, setCourseId] = React.useState('')
  const [jerseySize, setJerseySize] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<
    PaymentMethodChoice | ''
  >('')
  const [promoCode, setPromoCode] = React.useState('')
  const [promoInput, setPromoInput] = React.useState('')
  const [promoDiscount, setPromoDiscount] = React.useState(0)
  const [promoError, setPromoError] = React.useState('')
  const [applyingPromo, setApplyingPromo] = React.useState(false)
  const [donationAmount, setDonationAmount] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  const registrationByEmail = React.useMemo(() => {
    const map = new Map<string, RegistrationRef>()
    for (const registration of registrations) {
      map.set(registration.email.toLowerCase(), registration)
    }
    return map
  }, [registrations])

  React.useEffect(() => {
    if (!open) return
    setStep('user')
    setQuery('')
    setSelected(null)
    setUsers([])
    setGroups([])
    setGroupName('')
    setGroupError('')
    setCourseId(
      event.kind === 'flagship' ? '' : (event.courses?.[0]?.id ?? ''),
    )
    setJerseySize('')
    setPaymentMethod('')
    setPromoCode('')
    setPromoInput('')
    setPromoDiscount(0)
    setPromoError('')
    setDonationAmount(0)
    setError('')
    let cancelled = false
    setLoadingUsers(true)
    listUsers()
      .then((result) => {
        if (!cancelled) setUsers(result.users)
      })
      .catch((caught) => {
        if (cancelled) return
        toast.add({
          type: 'error',
          title:
            caught instanceof Error ? caught.message : 'Could not load users',
        })
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false)
      })

    if (event.kind === 'flagship') {
      setLoadingGroups(true)
      listEventGroups({ data: { slug: event.slug } })
        .then((result) => {
          if (!cancelled) {
            setGroups(result.map((group) => ({ id: group.id, name: group.name })))
          }
        })
        .catch((caught) => {
          if (cancelled) return
          toast.add({
            type: 'error',
            title:
              caught instanceof Error
                ? caught.message
                : 'Could not load groups',
          })
        })
        .finally(() => {
          if (!cancelled) setLoadingGroups(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [open, event.kind, event.slug, event.courses, courseKey])

  const matches = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    const pool = users.filter((account) => !account.banned)
    const filtered = needle
      ? pool.filter(
          (account) =>
            account.name.toLowerCase().includes(needle) ||
            account.email.toLowerCase().includes(needle),
        )
      : pool
    return { rows: filtered.slice(0, 8), hasMore: filtered.length > 8 }
  }, [query, users])

  const quote = registrationQuote(event, courseId, promoDiscount, donationAmount)
  const stepIndex = Math.max(0, steps.indexOf(step))
  const lastStep = steps[steps.length - 1] === step
  const registrationOpen = event.status === 'open'

  function chooseUser(account: AdminUserListItem) {
    const registration = registrationByEmail.get(account.email.toLowerCase())
    if (registration?.status === 'confirmed') return
    setSelected(account)
    if (steps.includes('jersey')) {
      const size = account.jerseySize.toUpperCase()
      setJerseySize(isJerseySize(size) ? size : '')
    }
    setGroupName(registration?.groupName ?? '')
  }

  function selectCourse(nextCourseId: string) {
    setCourseId(nextCourseId)
    setPromoCode('')
    setPromoInput('')
    setPromoDiscount(0)
    setPromoError('')
  }

  function groupNameTaken(name: string) {
    const needle = name.trim().toLowerCase()
    const own = selected
      ? registrationByEmail.get(selected.email.toLowerCase())?.groupName
      : null
    if (own && own.trim().toLowerCase() === needle) return false
    return groups.some((group) => group.name.trim().toLowerCase() === needle)
  }

  function goBack() {
    const previous = steps[stepIndex - 1]
    if (!previous) return
    setError('')
    setStep(previous)
  }

  function goNext() {
    if (step === 'group') {
      const trimmed = groupName.trim()
      if (!trimmed) {
        setGroupError('Enter a group name.')
        return
      }
      if (groupNameTaken(trimmed)) {
        setGroupError(
          `“${trimmed}” already exists. Try adding a number, e.g. ${trimmed} 1.`,
        )
        return
      }
    }
    const next = steps[stepIndex + 1]
    if (!next) return
    setError('')
    setStep(next)
  }

  async function applyPromo() {
    const code = promoInput.trim()
    if (!code || applyingPromo) return
    setApplyingPromo(true)
    setPromoError('')
    try {
      const result = await validateEventPromo({
        data: {
          slug: event.slug,
          code,
          categoryId: courseId || courses[0]?.id,
        },
      })
      setPromoCode(result.promo)
      setPromoDiscount(result.discountAmount)
      setPromoInput(result.promo)
    } catch (caught) {
      setPromoCode('')
      setPromoDiscount(0)
      setPromoError(
        caught instanceof Error ? caught.message : 'Could not apply promo code',
      )
    } finally {
      setApplyingPromo(false)
    }
  }

  function clearPromo() {
    setPromoInput('')
    setPromoCode('')
    setPromoDiscount(0)
    setPromoError('')
  }

  async function submit() {
    if (!selected || saving) return
    const categoryId =
      event.kind === 'flagship' ? courseId : (courses[0]?.id ?? '')
    if (!categoryId) {
      setError('Add a category before registering')
      return
    }
    if (steps.includes('jersey') && !jerseySize) {
      setError('Jersey size is required')
      return
    }
    if (quote.total > 0 && !paymentMethod) {
      setError('Choose a payment method')
      return
    }

    setSaving(true)
    setError('')
    try {
      const registered = await adminRegisterUserForEvent({
        data: {
          slug: event.slug,
          userId: selected.id,
          categoryId,
          groupName:
            event.kind === 'flagship' ? groupName.trim() : undefined,
          jerseySize: steps.includes('jersey') ? jerseySize : undefined,
          promoCode: promoCode || undefined,
          donationAmount: event.hasCharity
            ? Math.max(0, Math.round(donationAmount || 0))
            : 0,
        },
      })

      if (event.kind !== 'free') {
        const started = await startEventPayment({
          data: {
            participantId: registered.id,
            methodId: paymentMethod || 'qris_va',
          },
        })
        if (!started.confirmed && started.url) {
          window.location.assign(started.url)
          return
        }
        if (!started.confirmed) {
          setError('Could not start payment. Try again.')
          return
        }
      }

      toast.add({
        type: 'success',
        title: `${selected.name} is registered`,
      })
      await router.invalidate()
      setOpen(false)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not register user',
      )
    } finally {
      setSaving(false)
    }
  }

  const primaryDisabled =
    saving ||
    !registrationOpen ||
    (step === 'user' && (!selected || courses.length === 0)) ||
    (step === 'group' && (loadingGroups || !groupName.trim())) ||
    (step === 'course' && !courseId) ||
    (step === 'jersey' && !jerseySize) ||
    (step === 'payment' && quote.total > 0 && !paymentMethod)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button type="button" />}>
        Register user
      </DialogTrigger>
      <DialogContent className="max-h-[min(42rem,calc(100%-2rem))] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Register user</DialogTitle>
          <DialogDescription>
            Same steps as the public form. Their saved profile is used, so the
            profile step is skipped.
          </DialogDescription>
        </DialogHeader>

        {steps.length > 1 ? (
          <ol className="flex flex-wrap gap-2">
            {steps.map((item, index) => {
              const active = item === step
              const done = index < stepIndex
              return (
                <li key={item}>
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-medium tracking-[0.12em] uppercase',
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

        {step === 'user' ? (
          <UserStep
            loading={loadingUsers}
            matches={matches}
            onChoose={chooseUser}
            onQuery={setQuery}
            query={query}
            registrationByEmail={registrationByEmail}
            registrationOpen={registrationOpen}
            searchId={searchId}
            selected={selected}
            onClear={() => setSelected(null)}
            hasCategory={courses.length > 0}
          />
        ) : null}

        {step === 'group' ? (
          <Field data-invalid={Boolean(groupError)}>
            <FieldLabel htmlFor={`${searchId}-group`}>Group name</FieldLabel>
            <Input
              id={`${searchId}-group`}
              onChange={(input) => {
                setGroupName(input.target.value)
                setGroupError('')
              }}
              placeholder="Kopi Peloton"
              value={groupName}
            />
            {groupError ? (
              <FieldError>{groupError}</FieldError>
            ) : (
              <FieldDescription>
                Names must be unique for this event. Up to{' '}
                {event.groupCapacity ?? 8} riders.
              </FieldDescription>
            )}
          </Field>
        ) : null}

        {step === 'course' ? (
          <div className="grid gap-3">
            {courses.map((course) => {
              const active = courseId === course.id
              return (
                <button
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    active
                      ? 'border-foreground bg-muted/40'
                      : 'border-border hover:border-foreground/40',
                  )}
                  key={course.id}
                  onClick={() => selectCourse(course.id)}
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
                    {course.maxParticipants != null
                      ? ` · ${course.maxParticipants} spots`
                      : ''}
                  </p>
                  {course.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : null}

        {step === 'jersey' ? (
          <Field>
            <FieldLabel>Size</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {JERSEY_SIZES.map((size) => {
                const active = jerseySize === size
                return (
                  <button
                    className={cn(
                      'min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={size}
                    onClick={() => setJerseySize(size)}
                    type="button"
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            {selected?.jerseySize ? (
              <FieldDescription>
                Their account default is {selected.jerseySize.toUpperCase()}.
                Confirm a size for this event.
              </FieldDescription>
            ) : null}
          </Field>
        ) : null}

        {step === 'payment' ? (
          <PaymentFields
            applyingPromo={applyingPromo}
            event={event}
            groupName={groupName}
            jerseySize={jerseySize}
            onApplyPromo={() => void applyPromo()}
            onClearPromo={clearPromo}
            onDonation={setDonationAmount}
            onPaymentMethod={setPaymentMethod}
            onPromoInput={(value) => {
              setPromoInput(value)
              setPromoError('')
            }}
            paymentMethod={paymentMethod}
            promoCode={promoCode}
            promoError={promoError}
            promoInput={promoInput}
            quote={quote}
            riderEmail={selected?.email ?? ''}
            riderName={selected?.name ?? ''}
            searchId={searchId}
          />
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          {stepIndex === 0 ? (
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
          ) : (
            <Button onClick={goBack} type="button" variant="outline">
              Back
            </Button>
          )}
          <Button
            disabled={primaryDisabled}
            onClick={() => {
              if (lastStep) void submit()
              else goNext()
            }}
            type="button"
          >
            {saving ? (
              <>
                <Spinner />
                {event.kind === 'free'
                  ? 'Registering…'
                  : quote.total > 0
                    ? 'Redirecting…'
                    : 'Confirming…'}
              </>
            ) : lastStep ? (
              event.kind === 'free' ? (
                'Register'
              ) : quote.total > 0 ? (
                'Pay'
              ) : (
                'Confirm'
              )
            ) : (
              'Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserStep({
  searchId,
  selected,
  query,
  loading,
  matches,
  registrationByEmail,
  registrationOpen,
  hasCategory,
  onQuery,
  onChoose,
  onClear,
}: {
  searchId: string
  selected: AdminUserListItem | null
  query: string
  loading: boolean
  matches: { rows: AdminUserListItem[]; hasMore: boolean }
  registrationByEmail: Map<string, RegistrationRef>
  registrationOpen: boolean
  hasCategory: boolean
  onQuery: (value: string) => void
  onChoose: (account: AdminUserListItem) => void
  onClear: () => void
}) {
  return (
    <FieldGroup className="gap-4">
      {!registrationOpen ? (
        <p className="text-sm text-muted-foreground">
          Registration is not open for this event.
        </p>
      ) : null}
      {!hasCategory ? (
        <p className="text-sm text-muted-foreground">
          Add a category before registering someone.
        </p>
      ) : null}
      <Field>
        <FieldLabel htmlFor={searchId}>User</FieldLabel>
        {selected ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{selected.name}</p>
              <p className="truncate text-muted-foreground">{selected.email}</p>
            </div>
            <Button onClick={onClear} size="sm" type="button" variant="outline">
              Change
            </Button>
          </div>
        ) : (
          <>
            <Input
              id={searchId}
              onChange={(input) => onQuery(input.target.value)}
              placeholder="Search by name or email"
              value={query}
            />
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              {loading ? (
                <p className="flex items-center gap-2 px-3 py-3 text-muted-foreground">
                  <Spinner />
                  Loading users…
                </p>
              ) : matches.rows.length === 0 ? (
                <p className="px-3 py-3 text-muted-foreground">
                  No matching users.
                </p>
              ) : (
                <ul>
                  {matches.rows.map((account) => {
                    const registration = registrationByEmail.get(
                      account.email.toLowerCase(),
                    )
                    const taken = registration?.status === 'confirmed'
                    const pending = registration?.status === 'pending_payment'
                    return (
                      <li key={account.id}>
                        <button
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={taken}
                          onClick={() => onChoose(account)}
                          type="button"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {account.name}
                            </span>
                            <span className="block truncate text-muted-foreground">
                              {account.email}
                            </span>
                          </span>
                          {taken ? (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              Registered
                            </span>
                          ) : pending ? (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              Pending payment
                            </span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            {!loading && matches.hasMore ? (
              <FieldDescription>
                Showing the first matches. Search to narrow the list.
              </FieldDescription>
            ) : null}
          </>
        )}
      </Field>
    </FieldGroup>
  )
}

function PaymentFields({
  event,
  quote,
  riderName,
  riderEmail,
  groupName,
  jerseySize,
  searchId,
  promoInput,
  promoCode,
  promoError,
  applyingPromo,
  paymentMethod,
  onPromoInput,
  onApplyPromo,
  onClearPromo,
  onPaymentMethod,
  onDonation,
}: {
  event: ClubEvent
  quote: ReturnType<typeof registrationQuote>
  riderName: string
  riderEmail: string
  groupName: string
  jerseySize: string
  searchId: string
  promoInput: string
  promoCode: string
  promoError: string
  applyingPromo: boolean
  paymentMethod: PaymentMethodChoice | ''
  onPromoInput: (value: string) => void
  onApplyPromo: () => void
  onClearPromo: () => void
  onPaymentMethod: (method: PaymentMethodChoice) => void
  onDonation: (amount: number) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Review the entry, then pay to confirm the spot. Checkout uses the phone
        number saved on their profile.
      </p>

      {event.hasCharity ? (
        <DonationField
          amount={quote.donation}
          info={event.charityInfo}
          onChange={onDonation}
        />
      ) : null}

      <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border text-sm">
        <SummaryRow label="Rider" value={riderName || '—'} />
        <SummaryRow label="Email" value={riderEmail || '—'} />
        {event.kind === 'flagship' ? (
          <>
            <SummaryRow
              label="Course"
              value={
                quote.course
                  ? `${quote.course.name} (${quote.course.distance})`
                  : '—'
              }
            />
            <SummaryRow label="Group" value={groupName || '—'} />
            <SummaryRow label="Jersey" value={jerseySize || '—'} />
          </>
        ) : event.hasJersey ? (
          <SummaryRow label="Jersey" value={jerseySize || '—'} />
        ) : null}
        <SummaryRow label="Entry" value={formatIdr(quote.amount)} />
        {quote.serviceFee > 0 ? (
          <SummaryRow label="Service fee" value={formatIdr(quote.serviceFee)} />
        ) : null}
        {quote.discountAmount > 0 && promoCode ? (
          <SummaryRow
            label={`Promo (${promoCode})`}
            value={`−${formatIdr(quote.discountAmount)}`}
          />
        ) : null}
        {quote.donation > 0 ? (
          <SummaryRow label="Donation" value={formatIdr(quote.donation)} />
        ) : null}
        <SummaryRow label="Total" value={formatIdr(quote.total)} />
      </dl>

      <Field>
        <FieldLabel htmlFor={`${searchId}-promo`}>Promo code</FieldLabel>
        <div className="flex gap-2">
          <Input
            autoCapitalize="characters"
            className="uppercase"
            id={`${searchId}-promo`}
            onChange={(input) => onPromoInput(input.target.value.toUpperCase())}
            onKeyDown={(input) => {
              if (input.key === 'Enter') {
                input.preventDefault()
                onApplyPromo()
              }
            }}
            placeholder="Optional"
            value={promoInput}
          />
          {promoCode ? (
            <Button onClick={onClearPromo} type="button" variant="outline">
              Clear
            </Button>
          ) : (
            <Button
              disabled={!promoInput.trim() || applyingPromo}
              onClick={onApplyPromo}
              type="button"
              variant="outline"
            >
              {applyingPromo ? (
                <>
                  <Spinner /> Applying…
                </>
              ) : (
                'Apply'
              )}
            </Button>
          )}
        </div>
        {promoError ? (
          <FieldError>{promoError}</FieldError>
        ) : promoCode ? (
          <FieldDescription>
            Promo applied — {formatIdr(quote.discountAmount)} off entry.
          </FieldDescription>
        ) : (
          <FieldDescription>Have a code? Apply it before paying.</FieldDescription>
        )}
      </Field>

      {quote.total > 0 ? (
        <div className="grid gap-3">
          {paymentMethods.map((method) => {
            const active = paymentMethod === method.id
            return (
              <button
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  active
                    ? 'border-foreground bg-muted/40'
                    : 'border-border hover:border-foreground/40',
                )}
                key={method.id}
                onClick={() => onPaymentMethod(method.id)}
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
      ) : null}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function DonationField({
  amount,
  info,
  onChange,
}: {
  amount: number
  info?: string
  onChange: (amount: number) => void
}) {
  const [customInput, setCustomInput] = React.useState(() =>
    amount > 0 && !DONATION_PRESETS.some((preset) => preset === amount)
      ? String(amount)
      : '',
  )
  const usingCustom = customInput.length > 0

  function selectPreset(next: number) {
    setCustomInput('')
    onChange(next)
  }

  const choiceClass = (active: boolean) =>
    cn(
      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'border-sky-600 bg-sky-600 text-white'
        : 'border-sky-200 bg-white text-sky-950 hover:border-sky-400',
    )

  return (
    <section
      aria-labelledby="admin-charity-donation-heading"
      className="overflow-hidden rounded-lg border border-sky-200 bg-sky-50"
    >
      <div className="flex items-center gap-2 bg-sky-600 px-4 py-3 text-white">
        <HeartIcon aria-hidden className="size-4" weight="fill" />
        <h3
          className="font-heading text-sm font-semibold tracking-tight"
          id="admin-charity-donation-heading"
        >
          Additional donation
        </h3>
      </div>
      <div className="space-y-4 p-4">
        {info ? (
          <HtmlContent className="text-sm text-sky-950/80" html={info} />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            className={choiceClass(amount === 0 && !usingCustom)}
            onClick={() => selectPreset(0)}
            type="button"
          >
            No additional donation
          </button>
          {DONATION_PRESETS.map((preset) => (
            <button
              className={choiceClass(!usingCustom && amount === preset)}
              key={preset}
              onClick={() => selectPreset(preset)}
              type="button"
            >
              {formatIdr(preset)}
            </button>
          ))}
        </div>
        <div className="grid gap-2">
          <label
            className="text-sm font-medium text-sky-950"
            htmlFor="admin-charity-donation-custom"
          >
            Custom amount
          </label>
          <Input
            className="border-sky-200 bg-white"
            id="admin-charity-donation-custom"
            inputMode="numeric"
            onChange={(input) => {
              const digits = input.target.value.replace(/\D/g, '')
              setCustomInput(digits)
              onChange(Number(digits || 0))
            }}
            placeholder="Enter amount in IDR"
            value={customInput}
          />
        </div>
      </div>
    </section>
  )
}

import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  type ClubEvent,
  formatIdr,
  type JerseyOption,
  type RouteOption,
} from '~/data/events'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

export type FullRegisterStep = 'jersey' | 'route' | 'profile' | 'payment'
export type SimpleRegisterStep = 'profile' | 'done'
export type RegisterStep = FullRegisterStep | SimpleRegisterStep

export type RegisterDraft = {
  jerseyId: string
  jerseySize: string
  routeId: string
  fullName: string
  email: string
  phone: string
  club: string
  emergencyContact: string
}

const emptyDraft: RegisterDraft = {
  jerseyId: '',
  jerseySize: '',
  routeId: '',
  fullName: '',
  email: '',
  phone: '',
  club: '',
  emergencyContact: '',
}

const fullSteps: FullRegisterStep[] = ['jersey', 'route', 'profile', 'payment']
const simpleSteps: SimpleRegisterStep[] = ['profile', 'done']

const stepLabel: Record<RegisterStep, string> = {
  jersey: 'Jersey',
  route: 'Route',
  profile: 'Profile',
  payment: 'Payment',
  done: 'Done',
}

function storageKey(slug: string) {
  return `barong-register:${slug}`
}

function loadDraft(slug: string): RegisterDraft {
  if (typeof window === 'undefined') return emptyDraft
  try {
    const raw = sessionStorage.getItem(storageKey(slug))
    if (!raw) return emptyDraft
    return { ...emptyDraft, ...JSON.parse(raw) }
  } catch {
    return emptyDraft
  }
}

function saveDraft(slug: string, draft: RegisterDraft) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(storageKey(slug), JSON.stringify(draft))
}

export function EventRegisterWizard({
  event,
  step,
}: {
  event: ClubEvent
  step: RegisterStep
}) {
  const navigate = useNavigate()
  const steps = event.registration === 'full' ? fullSteps : simpleSteps
  const [draft, setDraft] = React.useState<RegisterDraft>(emptyDraft)

  React.useEffect(() => {
    setDraft(loadDraft(event.slug))
  }, [event.slug])

  function update(partial: Partial<RegisterDraft>) {
    setDraft((current) => {
      const next = { ...current, ...partial }
      saveDraft(event.slug, next)
      return next
    })
  }

  function goTo(nextStep: RegisterStep) {
    void navigate({
      to: '/events/$slug/register',
      params: { slug: event.slug },
      search: { step: nextStep },
    })
  }

  const stepIndex = Math.max(0, steps.indexOf(step as never))
  const isFull = event.registration === 'full'

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

      {isFull && step === 'jersey' ? (
        <JerseyStep
          draft={draft}
          jerseys={event.jerseys ?? []}
          onContinue={() => goTo('route')}
          onUpdate={update}
        />
      ) : null}

      {isFull && step === 'route' ? (
        <RouteStep
          draft={draft}
          onBack={() => goTo('jersey')}
          onContinue={() => goTo('profile')}
          onUpdate={update}
          routes={event.routes ?? []}
        />
      ) : null}

      {step === 'profile' ? (
        <ProfileStep
          draft={draft}
          onBack={isFull ? () => goTo('route') : undefined}
          onContinue={() => goTo(isFull ? 'payment' : 'done')}
          onUpdate={update}
        />
      ) : null}

      {isFull && step === 'payment' ? (
        <PaymentStep
          draft={draft}
          event={event}
          onBack={() => goTo('profile')}
          onPaid={() => {
            sessionStorage.removeItem(storageKey(event.slug))
            void navigate({
              to: '/events/$slug',
              params: { slug: event.slug },
            })
          }}
        />
      ) : null}

      {!isFull && step === 'done' ? (
        <DoneStep
          event={event}
          onFinish={() => {
            sessionStorage.removeItem(storageKey(event.slug))
            void navigate({
              to: '/events/$slug',
              params: { slug: event.slug },
            })
          }}
        />
      ) : null}
    </div>
  )
}

function JerseyStep({
  jerseys,
  draft,
  onUpdate,
  onContinue,
}: {
  jerseys: JerseyOption[]
  draft: RegisterDraft
  onUpdate: (partial: Partial<RegisterDraft>) => void
  onContinue: () => void
}) {
  const selected = jerseys.find((jersey) => jersey.id === draft.jerseyId)
  const canContinue = Boolean(draft.jerseyId && draft.jerseySize)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Choose your jersey
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kit is included in the Melali entry fee.
        </p>
      </div>

      <div className="grid gap-3">
        {jerseys.map((jersey) => {
          const active = draft.jerseyId === jersey.id
          return (
            <button
              className={cn(
                'border p-4 text-left transition-colors',
                active
                  ? 'border-foreground bg-muted/40'
                  : 'border-border hover:border-foreground/40',
              )}
              key={jersey.id}
              onClick={() =>
                onUpdate({
                  jerseyId: jersey.id,
                  jerseySize: active ? draft.jerseySize : '',
                })
              }
              type="button"
            >
              <p className="font-medium">{jersey.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {jersey.description}
              </p>
            </button>
          )
        })}
      </div>

      {selected ? (
        <Field>
          <FieldLabel>Size</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {selected.sizes.map((size) => {
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
        </Field>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={!canContinue} onClick={onContinue} type="button">
          Continue to route
        </Button>
      </div>
    </section>
  )
}

function RouteStep({
  routes,
  draft,
  onUpdate,
  onBack,
  onContinue,
}: {
  routes: RouteOption[]
  draft: RegisterDraft
  onUpdate: (partial: Partial<RegisterDraft>) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Choose your route
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Same start. Pick the distance that fits your day.
        </p>
      </div>

      <div className="grid gap-3">
        {routes.map((route) => {
          const active = draft.routeId === route.id
          return (
            <button
              className={cn(
                'border p-4 text-left transition-colors',
                active
                  ? 'border-foreground bg-muted/40'
                  : 'border-border hover:border-foreground/40',
              )}
              key={route.id}
              onClick={() => onUpdate({ routeId: route.id })}
              type="button"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{route.name}</p>
                <p className="text-sm font-medium tabular-nums">
                  {route.distance}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {route.description}
                {route.elevation ? ` · ${route.elevation}` : ''}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button
          disabled={!draft.routeId}
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
  onUpdate,
  onBack,
  onContinue,
}: {
  draft: RegisterDraft
  onUpdate: (partial: Partial<RegisterDraft>) => void
  onBack?: () => void
  onContinue: () => void
}) {
  const canContinue = Boolean(
    draft.fullName.trim() &&
      draft.email.trim() &&
      draft.phone.trim() &&
      draft.emergencyContact.trim(),
  )

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Rider profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used for start lists, kit sizing checks, and emergency contact.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            onChange={(event) => onUpdate({ fullName: event.target.value })}
            placeholder="Gede Riza"
            required
            value={draft.fullName}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            onChange={(event) => onUpdate({ email: event.target.value })}
            placeholder="rider@barong.ct"
            required
            type="email"
            value={draft.email}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone / WhatsApp</FieldLabel>
          <Input
            id="phone"
            onChange={(event) => onUpdate({ phone: event.target.value })}
            placeholder="+62 812 0000 0000"
            required
            value={draft.phone}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="club">Club (optional)</FieldLabel>
          <Input
            id="club"
            onChange={(event) => onUpdate({ club: event.target.value })}
            placeholder="Barong Cycling Team"
            value={draft.club}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="emergencyContact">Emergency contact</FieldLabel>
          <Input
            id="emergencyContact"
            onChange={(event) =>
              onUpdate({ emergencyContact: event.target.value })
            }
            placeholder="Name + phone"
            required
            value={draft.emergencyContact}
          />
          <FieldDescription>
            Someone we can reach on the day if needed.
          </FieldDescription>
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
        <Button disabled={!canContinue} onClick={onContinue} type="button">
          Continue
        </Button>
      </div>
    </section>
  )
}

function PaymentStep({
  event,
  draft,
  onBack,
  onPaid,
}: {
  event: ClubEvent
  draft: RegisterDraft
  onBack: () => void
  onPaid: () => void
}) {
  const jersey = event.jerseys?.find((item) => item.id === draft.jerseyId)
  const route = event.routes?.find((item) => item.id === draft.routeId)
  const amount = event.feeAmount ?? 0

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
        <SummaryRow label="Rider" value={draft.fullName} />
        <SummaryRow label="Email" value={draft.email} />
        <SummaryRow
          label="Jersey"
          value={`${jersey?.name ?? '—'} · ${draft.jerseySize || '—'}`}
        />
        <SummaryRow
          label="Route"
          value={
            route
              ? `${route.name} (${route.distance})`
              : '—'
          }
        />
        <SummaryRow label="Total" value={formatIdr(amount)} />
      </dl>

      <div className="border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Payment is stubbed for now — click pay to finish this draft flow.
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button onClick={onPaid} type="button">
          Pay {formatIdr(amount)}
        </Button>
      </div>
    </section>
  )
}

function DoneStep({
  event,
  onFinish,
}: {
  event: ClubEvent
  onFinish: () => void
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          You’re on the list
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          See you at {event.location} on {event.date}.
        </p>
      </div>
      <div className="flex justify-end">
        <Button onClick={onFinish} type="button">
          Back to event
        </Button>
      </div>
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

import * as React from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { CheckIcon } from '@phosphor-icons/react'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  formatOrderDate,
  orderItemCount,
  type OrderStatus,
  type ShopOrder,
} from '~/data/orders'
import { formatShopPrice, jerseySizeGuide, shopImageSrc } from '~/data/shop'
import {
  ACCOUNT_PROVINCES,
  accountDisplayName,
  useAccount,
  type AccountProfile,
} from '~/lib/account'
import { useShopOrders } from '~/lib/orders'
import { cn } from '~/lib/utils'

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  packed: 'border-sky-200 bg-sky-50 text-sky-800',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

const sections = [
  { to: '/account', label: 'Profile', exact: true },
  { to: '/account/address', label: 'Address', exact: false },
  { to: '/account/orders', label: 'Orders', exact: false },
] as const

export function AccountLayout() {
  const { profile, signedIn, ready, signIn, signOut } = useAccount()

  if (!ready) {
    return (
      <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <p className="border-y border-border py-10 text-sm text-muted-foreground">
          Loading account…
        </p>
      </section>
    )
  }

  if (!signedIn || !profile) {
    return <AccountSignIn onSignIn={signIn} />
  }

  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10 sm:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Account
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {profile.firstName.trim()
              ? accountDisplayName(profile)
              : 'Your account'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <button
          className="shrink-0 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:pt-0"
          onClick={signOut}
          type="button"
        >
          Sign out
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[12.5rem_minmax(0,40rem)] lg:items-start lg:gap-12 xl:gap-16">
        <AccountSectionNav />
        <div>
          <Outlet />
        </div>
      </div>
    </section>
  )
}

function AccountSectionNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <>
      <nav
        aria-label="Account sections"
        className="mb-8 flex gap-1 overflow-x-auto border-b border-border lg:hidden"
        role="tablist"
      >
        {sections.map((section) => {
          const active = isSectionActive(pathname, section)
          return (
            <Link
              aria-selected={active}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              key={section.to}
              role="tab"
              to={section.to}
            >
              {section.label}
            </Link>
          )
        })}
      </nav>

      <nav
        aria-label="Account sections"
        className="hidden lg:sticky lg:top-6 lg:flex lg:flex-col"
      >
        {sections.map((section) => {
          const active = isSectionActive(pathname, section)
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                'border-l-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground',
              )}
              key={section.to}
              to={section.to}
            >
              {section.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

function isSectionActive(
  pathname: string,
  section: (typeof sections)[number],
) {
  if (section.exact) {
    return pathname === '/account' || pathname === '/account/'
  }
  return pathname === section.to
}

function AccountSignIn({ onSignIn }: { onSignIn: (email: string) => void }) {
  const [email, setEmail] = React.useState('')
  const [error, setError] = React.useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email')
      return
    }
    setError('')
    onSignIn(email)
  }

  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          New here? We’ll open an account for this email so you can save kit
          size and delivery details.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <AccountField
            autoComplete="email"
            error={error}
            id="account-email"
            label="Email"
            onChange={(value) => {
              setEmail(value)
              setError('')
            }}
            type="email"
            value={email}
          />
          <Button className="w-full" size="lg" type="submit">
            Continue
          </Button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Demo — try{' '}
          <button
            className="underline underline-offset-4 hover:text-foreground"
            onClick={() => onSignIn('made.wirawan@email.com')}
            type="button"
          >
            made.wirawan@email.com
          </button>{' '}
          to see a rider with past orders.
        </p>
      </div>
    </section>
  )
}

export function AccountProfilePanel() {
  const { profile, updateProfile } = useAccount()
  const [draft, setDraft] = React.useState(() => profile ?? emptyDraft())
  const [saved, setSaved] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (profile) setDraft(profile)
  }, [profile])

  if (!profile) return null

  function setField<K extends keyof AccountProfile>(
    key: K,
    value: AccountProfile[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!draft.firstName.trim()) next.firstName = 'Enter a first name'
    if (!draft.lastName.trim()) next.lastName = 'Enter a last name'
    if (!draft.email.includes('@')) next.email = 'Enter a valid email'
    if (!draft.phone.trim()) next.phone = 'Enter a phone number'
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setErrors({})
    updateProfile({
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      phone: draft.phone,
      jerseySize: draft.jerseySize,
    })
    setSaved(true)
  }

  return (
    <form onSubmit={handleSave}>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Profile
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Used at checkout and when we WhatsApp about pickup.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AccountField
          autoComplete="given-name"
          error={errors.firstName}
          id="firstName"
          label="First name"
          onChange={(value) => setField('firstName', value)}
          value={draft.firstName}
        />
        <AccountField
          autoComplete="family-name"
          error={errors.lastName}
          id="lastName"
          label="Last name"
          onChange={(value) => setField('lastName', value)}
          value={draft.lastName}
        />
        <AccountField
          autoComplete="email"
          error={errors.email}
          id="email"
          label="Email"
          onChange={(value) => setField('email', value)}
          type="email"
          value={draft.email}
        />
        <AccountField
          autoComplete="tel"
          error={errors.phone}
          id="phone"
          label="Phone"
          onChange={(value) => setField('phone', value)}
          type="tel"
          value={draft.phone}
        />
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Club kit size
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Race-fit. We’ll remember this when you add a jersey.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {jerseySizeGuide.sizes.map((size) => {
          const active = draft.jerseySize === size
          return (
            <button
              aria-pressed={active}
              className={cn(
                'min-w-12 border px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40',
              )}
              key={size}
              onClick={() => setField('jerseySize', size)}
              type="button"
            >
              {size}
            </button>
          )
        })}
      </div>

      <SaveBar saved={saved} />
    </form>
  )
}

export function AccountAddressPanel() {
  const { profile, updateProfile } = useAccount()
  const [draft, setDraft] = React.useState(() => profile ?? emptyDraft())
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    if (profile) setDraft(profile)
  }, [profile])

  if (!profile) return null

  function setField<K extends keyof AccountProfile>(
    key: K,
    value: AccountProfile[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    updateProfile({
      address: draft.address,
      apartment: draft.apartment,
      city: draft.city,
      province: draft.province,
      postal: draft.postal,
    })
    setSaved(true)
  }

  return (
    <form onSubmit={handleSave}>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Shipping address
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        For shipped orders. Pickup still uses the Denpasar meet point.
      </p>
      <div className="mt-5 grid gap-3">
        <AccountField
          autoComplete="address-line1"
          id="address"
          label="Address"
          onChange={(value) => setField('address', value)}
          value={draft.address}
        />
        <AccountField
          autoComplete="address-line2"
          id="apartment"
          label="Apartment, suite, etc. (optional)"
          onChange={(value) => setField('apartment', value)}
          value={draft.apartment}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <AccountField
            autoComplete="address-level2"
            id="city"
            label="City"
            onChange={(value) => setField('city', value)}
            value={draft.city}
          />
          <AccountSelect
            id="province"
            label="Province"
            onChange={(value) => setField('province', value)}
            value={draft.province}
          >
            {ACCOUNT_PROVINCES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </AccountSelect>
          <AccountField
            autoComplete="postal-code"
            id="postal"
            label="Postal code"
            onChange={(value) => setField('postal', value)}
            value={draft.postal}
          />
        </div>
      </div>
      <SaveBar saved={saved} />
    </form>
  )
}

export function AccountOrdersPanel() {
  const { profile } = useAccount()
  const { orders, ready } = useShopOrders()

  if (!profile) return null

  const mine = orders.filter(
    (order) =>
      order.email.trim().toLowerCase() === profile.email.trim().toLowerCase(),
  )

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Order history
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Kit placed with this email, including pickup and shipped orders.
      </p>
      {!ready ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading orders…</p>
      ) : mine.length === 0 ? (
        <div className="mt-6 border-y border-border py-10">
          <p className="font-heading text-base font-medium tracking-tight">
            No orders yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Jerseys you check out will land here.
          </p>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-5')}
            to="/shop"
          >
            Shop jerseys
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {mine.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SaveBar({ saved }: { saved: boolean }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Button size="lg" type="submit">
        Save
      </Button>
      {saved ? (
        <p className="inline-flex items-center gap-1.5 text-sm">
          <CheckIcon aria-hidden className="size-4" weight="bold" />
          Saved
        </p>
      ) : null}
    </div>
  )
}

function emptyDraft(): AccountProfile {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jerseySize: 'M',
    address: '',
    apartment: '',
    city: '',
    province: 'Bali',
    postal: '',
  }
}

function OrderRow({ order }: { order: ShopOrder }) {
  const count = orderItemCount(order)
  return (
    <li className="py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{order.id}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatOrderDate(order.placedAt)}
            <span className="text-border"> · </span>
            {count} {count === 1 ? 'item' : 'items'}
            <span className="text-border"> · </span>
            {order.shippingLabel}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
            orderStatusStyles[order.status],
          )}
        >
          {order.status}
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {order.lines.map((line) => (
          <li
            className="flex items-center gap-3"
            key={`${order.id}-${line.slug}-${line.size}`}
          >
            <img
              alt=""
              className="size-14 object-cover"
              height={112}
              src={shopImageSrc(line.image, 112)}
              width={112}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{line.name}</p>
              <p className="text-xs text-muted-foreground">
                Size {line.size}
                <span className="text-border"> · </span>
                {line.color}
                <span className="text-border"> · </span>
                {line.quantity}×
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums">
              {formatShopPrice(line.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-medium tabular-nums">
          {formatShopPrice(order.total)}
        </span>
      </p>
    </li>
  )
}

function AccountField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  error?: string
}) {
  return (
    <div>
      <label
        className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cn(
          'mt-1.5 h-11 w-full border bg-background px-3 text-sm outline-none transition-shadow focus:border-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
          error ? 'border-destructive' : 'border-border',
        )}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function AccountSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        className="mt-1.5 h-11 w-full appearance-none border border-border bg-background px-3 text-sm outline-none focus:border-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </div>
  )
}

import * as React from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  TruckIcon,
} from '@phosphor-icons/react'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  courierLabel,
  formatOrderDate,
  formatPaymentLabel,
  orderCustomerName,
  orderItemCount,
  orderNeedsPayment,
  orderStatusLabel,
  orderStatusStyles,
  type ShopOrder,
} from '~/data/orders'
import { formatCustomMeasurements, formatShopPrice, jerseySizeGuide, shopImageSrc } from '~/data/shop'
import {
  ACCOUNT_BLOOD_TYPES,
  ACCOUNT_GENDERS,
  ACCOUNT_PROVINCES,
  accountDisplayName,
  accountInitials,
  emptyShippingAddress,
  useAccount,
  type AccountProfile,
  type AccountShippingAddress,
} from '~/lib/account'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { toast } from '~/components/ui/toast'
import { listMyOrders } from '~/lib/order.functions'
import { startPayment } from '~/lib/payment.functions'
import { cn } from '~/lib/utils'

const sections = [
  { to: '/account', label: 'Profile', exact: true },
  { to: '/account/address', label: 'Shipping Address', exact: false },
  { to: '/account/orders', label: 'Orders', exact: false },
] as const

export function AccountLayout() {
  const { profile, signedIn, ready, signOut } = useAccount()

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
    return (
      <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage kit size, delivery details, and orders.
        </p>
        <Link className={cn(buttonVariants(), 'mt-6')} to="/auth/login">
          Sign in
        </Link>
      </section>
    )
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

      <div className="lg:grid lg:grid-cols-[12.5rem_minmax(0,52rem)] lg:items-start lg:gap-12 xl:gap-16">
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
  return pathname === section.to || pathname.startsWith(`${section.to}/`)
}

export function AccountProfilePanel() {
  const { profile, updateProfile, uploadAvatarImage, clearAvatarImage } =
    useAccount()
  const [draft, setDraft] = React.useState(() => profile ?? emptyDraft())
  const [pending, setPending] = React.useState(false)
  const [avatarPending, setAvatarPending] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (profile) setDraft(profile)
  }, [profile])

  if (!profile) return null

  function setField<K extends keyof AccountProfile>(
    key: K,
    value: AccountProfile[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors({ form: 'Use a JPG, PNG, or WebP image.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ form: 'Image must be 2MB or smaller.' })
      return
    }

    setErrors({})
    setAvatarPending(true)
    try {
      const image = await uploadAvatarImage(file)
      setDraft((current) => ({ ...current, avatarUrl: image }))
    } catch {
      setErrors({ form: 'Could not upload avatar.' })
    } finally {
      setAvatarPending(false)
    }
  }

  async function clearAvatar() {
    setErrors({})
    setAvatarPending(true)
    try {
      await clearAvatarImage()
      setDraft((current) => ({ ...current, avatarUrl: '' }))
    } catch {
      setErrors({ form: 'Could not remove avatar.' })
    } finally {
      setAvatarPending(false)
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})
    setPending(true)
    try {
      await updateProfile({
        firstName: draft.firstName,
        lastName: draft.lastName,
        phone: draft.phone,
        gender: draft.gender,
        bloodType: draft.bloodType,
        dateOfBirth: draft.dateOfBirth,
        nationality: draft.nationality,
        idNumber: draft.idNumber,
        emergencyContactName: draft.emergencyContactName,
        emergencyContactPhone: draft.emergencyContactPhone,
        jerseySize: draft.jerseySize,
        address: draft.address,
        apartment: draft.apartment,
        city: draft.city,
        province: draft.province,
        postal: draft.postal,
      })
      toast.add({
        type: 'success',
        title: 'Profile saved',
      })
    } catch {
      setErrors({ form: 'Could not save profile' })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Profile
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Used at checkout and when we WhatsApp about pickup.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <Avatar className="size-20 after:rounded-full data-[size=default]:size-20">
          {draft.avatarUrl ? (
            <AvatarImage alt="" src={draft.avatarUrl} />
          ) : null}
          <AvatarFallback className="bg-foreground font-heading text-lg font-semibold text-background">
            {accountInitials(draft)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Avatar
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG, or WebP up to 2MB.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void onAvatarChange(event)}
              ref={fileInputRef}
              type="file"
            />
            <Button
              disabled={avatarPending}
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              {avatarPending ? 'Uploading…' : 'Change photo'}
            </Button>
            {draft.avatarUrl ? (
              <Button
                disabled={avatarPending}
                onClick={() => void clearAvatar()}
                size="sm"
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <AccountField
          autoComplete="given-name"
          id="firstName"
          label="First name"
          onChange={(value) => setField('firstName', value)}
          required
          value={draft.firstName}
        />
        <AccountField
          autoComplete="family-name"
          id="lastName"
          label="Last name"
          onChange={(value) => setField('lastName', value)}
          required
          value={draft.lastName}
        />
        <AccountField
          autoComplete="email"
          id="email"
          label="Email"
          readOnly
          type="email"
          value={draft.email}
        />
        <AccountField
          autoComplete="tel"
          id="phone"
          label="Phone"
          onChange={(value) => setField('phone', value)}
          type="tel"
          value={draft.phone}
        />
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Rider details
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Helps with event registration and medical info on the road.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AccountSelect
          id="gender"
          label="Gender"
          onChange={(value) => setField('gender', value)}
          value={draft.gender}
        >
          <option value="">Select</option>
          {ACCOUNT_GENDERS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AccountSelect>
        <AccountSelect
          id="bloodType"
          label="Blood type"
          onChange={(value) => setField('bloodType', value)}
          value={draft.bloodType}
        >
          <option value="">Select</option>
          {ACCOUNT_BLOOD_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AccountSelect>
        <AccountField
          autoComplete="bday"
          id="dateOfBirth"
          label="Date of birth"
          onChange={(value) => setField('dateOfBirth', value)}
          type="date"
          value={draft.dateOfBirth}
        />
        <AccountField
          autoComplete="country-name"
          id="nationality"
          label="Nationality"
          onChange={(value) => setField('nationality', value)}
          value={draft.nationality}
        />
        <AccountField
          id="idNumber"
          label="KTP or ID"
          onChange={(value) => setField('idNumber', value)}
          value={draft.idNumber}
        />
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Emergency contact
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Who we should call if something happens on a ride.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AccountField
          autoComplete="name"
          id="emergencyContactName"
          label="Contact name"
          onChange={(value) => setField('emergencyContactName', value)}
          value={draft.emergencyContactName}
        />
        <AccountField
          autoComplete="tel"
          id="emergencyContactPhone"
          label="Contact phone"
          onChange={(value) => setField('emergencyContactPhone', value)}
          type="tel"
          value={draft.emergencyContactPhone}
        />
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Address
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Used for event information. Shipping stays on the Shipping Address page.
      </p>
      <AddressFields
        idPrefix="profile"
        onChange={(key, value) => setField(key, value)}
        value={draft}
      />

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Preferred Jersey Size
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

      {errors.form ? (
        <p className="mt-4 text-sm text-destructive">{errors.form}</p>
      ) : null}

      <SaveBar label="Save changes" pending={pending} />
    </form>
  )
}

export function AccountAddressPanel() {
  const { shippingAddress, updateShippingAddress } = useAccount()
  const [draft, setDraft] = React.useState<AccountShippingAddress>(
    () => shippingAddress ?? emptyShippingAddress(),
  )
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    setDraft(shippingAddress ?? emptyShippingAddress())
  }, [shippingAddress])

  function setField<K extends keyof AccountShippingAddress>(
    key: K,
    value: AccountShippingAddress[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await updateShippingAddress({
        id: draft.id,
        address: draft.address,
        apartment: draft.apartment,
        city: draft.city,
        province: draft.province,
        postal: draft.postal,
      })
      toast.add({
        type: 'success',
        title: 'Shipping address saved',
      })
    } catch {
      setError('Could not save shipping address')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Shipping address
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        For shipped kit orders. One address for now — more can be added later.
      </p>
      <AddressFields
        idPrefix="shipping"
        onChange={(key, value) => setField(key, value)}
        value={draft}
      />
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <SaveBar pending={pending} />
    </form>
  )
}

export function AccountOrdersPanel({
  orders: initialOrders,
}: {
  orders?: ShopOrder[]
}) {
  const { profile } = useAccount()
  const [orders, setOrders] = React.useState<ShopOrder[]>(initialOrders ?? [])
  const [ready, setReady] = React.useState(Array.isArray(initialOrders))

  React.useEffect(() => {
    if (Array.isArray(initialOrders)) {
      setOrders(initialOrders)
      setReady(true)
      return
    }
    let cancelled = false
    void listMyOrders()
      .then((rows) => {
        if (!cancelled) setOrders(rows ?? [])
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [initialOrders])

  if (!profile) return null

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Order history
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Kit placed on this account.
      </p>
      {!ready ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
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
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SaveBar({
  pending,
  label = 'Save',
}: {
  pending?: boolean
  label?: string
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Button disabled={pending} size="lg" type="submit">
        {pending ? 'Saving…' : label}
      </Button>
    </div>
  )
}

function emptyDraft(): AccountProfile {
  return {
    avatarUrl: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    bloodType: '',
    dateOfBirth: '',
    nationality: '',
    idNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
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
  const preview = order.lines[0]
  return (
    <li>
      <Link
        className="flex items-center gap-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
        params={{ id: order.id }}
        to="/account/orders/$id"
      >
        {preview ? (
          <img
            alt=""
            className="size-14 shrink-0 object-cover bg-muted"
            height={112}
            src={shopImageSrc(preview.image, 112)}
            width={112}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{order.id}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatOrderDate(order.placedAt)}
            <span className="text-border"> · </span>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-sm font-medium tabular-nums">
            {formatShopPrice(order.total)}
          </span>
          <span
            className={cn(
              'border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
              orderStatusStyles[order.status],
            )}
          >
            {orderStatusLabel(order.status)}
          </span>
        </div>
      </Link>
    </li>
  )
}

function CopyTrackingButton({ trackingNumber }: { trackingNumber: string }) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopied(true)
      toast.add({ type: 'success', title: 'Tracking number copied' })
    } catch {
      toast.add({ type: 'error', title: 'Could not copy tracking number' })
    }
  }

  return (
    <Button
      onClick={() => void copy()}
      size="xs"
      type="button"
      variant="ghost"
    >
      {copied ? (
        <CheckIcon data-icon="inline-start" weight="bold" />
      ) : (
        <CopyIcon data-icon="inline-start" weight="bold" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

function PayNowButton({ order }: { order: ShopOrder }) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

  async function pay() {
    setPending(true)
    setError('')
    try {
      const started = await startPayment({ data: { orderNumber: order.id } })
      window.location.assign(started.url)
    } catch (caught) {
      setPending(false)
      setError(caught instanceof Error ? caught.message : 'Could not start payment')
    }
  }

  return (
    <div>
      <Button disabled={pending} onClick={() => void pay()} type="button">
        {pending ? 'Redirecting…' : `Pay ${formatShopPrice(order.total)}`}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export function AccountOrderDetailPanel({ order }: { order: ShopOrder }) {
  const count = orderItemCount(order)

  return (
    <div>
      <Link
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        to="/account/orders"
      >
        <ArrowLeftIcon className="size-3.5" weight="bold" />
        Back to orders
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {order.id}
          </h2>
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
              orderStatusStyles[order.status],
            )}
          >
            {orderStatusLabel(order.status)}
          </span>
        </div>
        {orderNeedsPayment(order) ? <PayNowButton order={order} /> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatOrderDate(order.placedAt)}
        <span className="text-border"> · </span>
        {count} {count === 1 ? 'item' : 'items'}
      </p>

      <ul className="mt-6 divide-y divide-border border-y border-border">
        {order.lines.map((line) => (
          <li
            className="flex items-start gap-4 py-5"
            key={`${order.id}-${line.slug}-${line.size}-${line.custom?.chest ?? ''}`}
          >
            <img
              alt=""
              className="size-16 shrink-0 object-cover bg-muted sm:size-20"
              height={160}
              src={shopImageSrc(line.image, 160)}
              width={160}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {line.quantity} × {line.name}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {line.color}, size {line.size}
                {line.preOrder ? ', pre order' : ''}
              </p>
              {line.custom ? (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatCustomMeasurements(line.custom)}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-medium tabular-nums">
              {formatShopPrice(line.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CreditCardIcon className="size-4" weight="bold" />
            Payment information
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            {order.payment?.transactionId ? (
              <div>
                <dt className="font-medium">Payment ID</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {order.payment.transactionId}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium">Method</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {formatPaymentLabel(order)}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <TruckIcon className="size-4" weight="bold" />
            Delivery information
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium">
                {order.delivery === 'pickup' ? 'Pickup' : 'Delivery type'}
              </dt>
              <dd className="mt-0.5 text-muted-foreground">
                {order.shippingLabel}
              </dd>
            </div>
            {order.delivery !== 'pickup' &&
            order.courier &&
            order.trackingNumber ? (
              <div>
                <dt className="font-medium">Tracking</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {courierLabel(order.courier)}
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span>{order.trackingNumber}</span>
                    <CopyTrackingButton trackingNumber={order.trackingNumber} />
                  </div>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium">
                {order.delivery === 'pickup' ? 'Location' : 'Address'}
              </dt>
              <dd className="mt-0.5 text-muted-foreground">
                {order.delivery === 'pickup' ? null : (
                  <>
                    {orderCustomerName(order)}
                    <br />
                  </>
                )}
                {order.address}
                <br />
                {[order.city, order.province, order.postal]
                  .filter(Boolean)
                  .join(' ')}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Summary</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Products</dt>
              <dd className="tabular-nums">{formatShopPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">
                  −{formatShopPrice(order.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {order.shipping === 0 ? 'Free' : formatShopPrice(order.shipping)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatShopPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

type AddressValues = {
  address: string
  apartment: string
  city: string
  province: string
  postal: string
}

function AddressFields({
  value,
  onChange,
  idPrefix,
}: {
  value: AddressValues
  onChange: (key: keyof AddressValues, next: string) => void
  idPrefix: string
}) {
  return (
    <div className="mt-5 grid gap-3">
      <AccountField
        autoComplete="address-line1"
        id={`${idPrefix}-address`}
        label="Address"
        onChange={(next) => onChange('address', next)}
        value={value.address}
      />
      <AccountField
        autoComplete="address-line2"
        id={`${idPrefix}-apartment`}
        label="Apartment, suite, etc. (optional)"
        onChange={(next) => onChange('apartment', next)}
        value={value.apartment}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <AccountField
          autoComplete="address-level2"
          id={`${idPrefix}-city`}
          label="City"
          onChange={(next) => onChange('city', next)}
          value={value.city}
        />
        <AccountSelect
          id={`${idPrefix}-province`}
          label="Province"
          onChange={(next) => onChange('province', next)}
          value={value.province}
        >
          {ACCOUNT_PROVINCES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </AccountSelect>
        <AccountField
          autoComplete="postal-code"
          id={`${idPrefix}-postal`}
          label="Postal code"
          onChange={(next) => onChange('postal', next)}
          value={value.postal}
        />
      </div>
    </div>
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
  readOnly,
  required,
}: {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  type?: string
  autoComplete?: string
  error?: string
  readOnly?: boolean
  required?: boolean
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
          'mt-1.5 h-11 w-full border px-3 text-sm outline-none transition-shadow focus:border-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
          readOnly
            ? 'cursor-default bg-muted text-muted-foreground'
            : 'bg-background',
          error ? 'border-destructive' : 'border-border',
        )}
        id={id}
        onChange={
          readOnly || !onChange
            ? undefined
            : (event) => onChange(event.target.value)
        }
        readOnly={readOnly}
        required={required}
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

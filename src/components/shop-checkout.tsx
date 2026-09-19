import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CaretDownIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BankIcon,
  LockSimpleIcon,
  QrCodeIcon,
  ShoppingBagIcon,
} from '@phosphor-icons/react'
import { CheckoutSkeleton } from '~/components/page-skeletons'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import {
  findShopProduct,
  formatCustomMeasurements,
  formatShopPrice,
  shopImageSrc,
  type ShopProduct,
} from '~/data/shop'
import {
  orderCustomerName,
  orderNeedsPayment,
  orderPickupPointName,
  type ShopOrder,
} from '~/data/orders'
import {
  formatPickupAddress,
  type PickupPoint,
} from '~/data/pickup-points'
import { useAccount } from '~/lib/account'
import { cartLineKey, useCart, type CartItem } from '~/lib/cart'
import { placeOrder } from '~/lib/order.functions'
import { startPayment } from '~/lib/payment.functions'
import { dokuCardServiceFee } from '~/lib/payment/doku-card-fee'
import type { PaymentDisplay, PaymentMethodId } from '~/lib/payment/types'
import { cn } from '~/lib/utils'

type CartLine = CartItem & { product: ShopProduct }

type CheckoutDraft = {
  email: string
  firstName: string
  lastName: string
  phone: string
}

function cartLines(items: CartItem[], products: ShopProduct[]): CartLine[] {
  return items.flatMap((item) => {
    const product = findShopProduct(products, item.slug)
    if (!product) return []
    return [{ ...item, product }]
  })
}

function checkoutFieldErrors({
  email,
  firstName,
  lastName,
  phone,
  pickupPointId,
  methodId,
}: {
  email: string
  firstName: string
  lastName: string
  phone: string
  pickupPointId: string
  methodId: string
}) {
  const next: Record<string, string> = {}
  if (!email.includes('@')) next.email = 'Enter a valid email'
  if (!firstName.trim()) next.firstName = 'Enter a first name'
  if (!lastName.trim()) next.lastName = 'Enter a last name'
  if (!phone.trim()) next.phone = 'Enter a phone number'
  if (!pickupPointId) next.pickup = 'Select a pickup location'
  if (!methodId) next.payment = 'Select a payment method'
  return next
}

export function ShopCheckout({
  products,
  paymentDisplay,
  pickupPoints,
}: {
  products: ShopProduct[]
  paymentDisplay: PaymentDisplay
  pickupPoints: PickupPoint[]
}) {
  const navigate = useNavigate()
  const { items, clear, ready, openSheet } = useCart()
  const { profile } = useAccount()
  const lines = cartLines(items, products)
  const [pending, setPending] = React.useState(false)
  const [summaryOpen, setSummaryOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Partial<CheckoutDraft>>({})
  const [pickupPointId, setPickupPointId] = React.useState(
    pickupPoints[0]?.id ?? '',
  )
  const [methodId, setMethodId] = React.useState<PaymentMethodId>(
    paymentDisplay.methods[0]?.id ?? 'qris_va',
  )
  const [didSubmit, setDidSubmit] = React.useState(false)
  const [actionError, setActionError] = React.useState<Record<string, string>>(
    {},
  )

  const email = draft.email ?? profile?.email ?? ''
  const firstName = draft.firstName ?? profile?.firstName ?? ''
  const lastName = draft.lastName ?? profile?.lastName ?? ''
  const phone = draft.phone ?? profile?.phone ?? ''
  const fieldErrors = didSubmit
    ? checkoutFieldErrors({
        email,
        firstName,
        lastName,
        phone,
        pickupPointId,
        methodId,
      })
    : {}
  const errors = { ...fieldErrors, ...actionError }
  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )
  const serviceFee =
    methodId === 'card' ? dokuCardServiceFee(subtotal) : 0
  const total = subtotal + serviceFee
  const bagCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const selectedPickup =
    pickupPoints.find((point) => point.id === pickupPointId) ?? null

  function patchDraft<K extends keyof CheckoutDraft>(
    key: K,
    value: CheckoutDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  React.useEffect(() => {
    if (pending || !ready || items.length > 0) return
    void navigate({ to: '/shop/cart' })
  }, [pending, ready, items.length, navigate])

  React.useEffect(() => {
    if (pickupPoints.some((point) => point.id === pickupPointId)) return
    setPickupPointId(pickupPoints[0]?.id ?? '')
  }, [pickupPoints, pickupPointId])

  React.useEffect(() => {
    if (paymentDisplay.methods.some((method) => method.id === methodId)) return
    setMethodId(paymentDisplay.methods[0]?.id ?? 'qris_va')
  }, [paymentDisplay.methods, methodId])

  async function handlePay(event: React.FormEvent) {
    event.preventDefault()
    setDidSubmit(true)
    setActionError({})
    const next = checkoutFieldErrors({
      email,
      firstName,
      lastName,
      phone,
      pickupPointId,
      methodId,
    })
    if (Object.keys(next).length > 0) return
    if (!selectedPickup) {
      setActionError({ pickup: 'Select a pickup location' })
      return
    }

    setPending(true)
    try {
      const placed = await placeOrder({
        data: {
          email,
          firstName,
          lastName,
          phone,
          pickupPointId,
          lines: lines.map((item) => ({
            slug: item.slug,
            size: item.size,
            quantity: item.quantity,
            custom: item.custom,
          })),
        },
      })
      try {
        const started = await startPayment({
          data: { orderNumber: placed.id, methodId },
        })
        clear()
        window.location.assign(started.url)
      } catch (error) {
        setPending(false)
        setActionError({
          form:
            error instanceof Error ? error.message : 'Could not start payment',
        })
      }
    } catch (error) {
      setPending(false)
      setActionError({
        form: error instanceof Error ? error.message : 'Could not place order',
      })
    }
  }

  if (!pending && (!ready || items.length === 0)) {
    return <CheckoutSkeleton />
  }

  const summary = (
    <OrderSummary
      delivery="pickup"
      lines={lines}
      serviceFee={serviceFee}
      subtotal={subtotal}
      total={total}
    />
  )

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div className="lg:hidden border-b border-border bg-neutral-100">
        <button
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-sm"
          onClick={() => setSummaryOpen((open) => !open)}
          type="button"
        >
          <span className="inline-flex items-center gap-1 text-sky-800">
            {summaryOpen ? 'Hide' : 'Show'} order summary
            <CaretDownIcon
              className={cn('size-3.5 transition-transform', summaryOpen && 'rotate-180')}
              weight="bold"
            />
          </span>
          <span className="font-heading text-base font-semibold tabular-nums">
            {formatShopPrice(total)}
          </span>
        </button>
        {summaryOpen ? <div className="border-t border-border px-5 py-5">{summary}</div> : null}
      </div>

      <div className="px-5 py-6 sm:px-10 lg:px-16 lg:py-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            to="/"
          >
            <img
              alt="Barong Cycling Team"
              className="h-9 w-auto"
              height={36}
              src="/barong_logo.png"
              width={28}
            />
          </Link>
          <button
            aria-label={
              bagCount > 0
                ? `Bag, ${bagCount} ${bagCount === 1 ? 'item' : 'items'}`
                : 'Bag'
            }
            className="relative text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={openSheet}
            type="button"
          >
            <ShoppingBagIcon
              aria-hidden
              className="size-5"
              weight={bagCount > 0 ? 'fill' : 'regular'}
            />
            {bagCount > 0 ? (
              <span className="absolute -top-1.5 -right-2 grid min-w-4 place-items-center rounded-full bg-foreground px-1 text-[0.65rem] leading-4 font-medium text-background tabular-nums">
                {bagCount}
              </span>
            ) : null}
          </button>
        </header>

        <form className="mx-auto max-w-xl space-y-8" onSubmit={handlePay}>
          <section>
            <h2 className="mb-3 text-[1.35rem] font-semibold tracking-tight">Contact</h2>
            <div className="grid gap-3">
              <CheckoutField
                autoComplete="email"
                error={errors.email}
                id="email"
                label="Email"
                onChange={(value) => patchDraft('email', value)}
                type="email"
                value={email}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckoutField
                  autoComplete="given-name"
                  error={errors.firstName}
                  id="firstName"
                  label="First name"
                  onChange={(value) => patchDraft('firstName', value)}
                  value={firstName}
                />
                <CheckoutField
                  autoComplete="family-name"
                  error={errors.lastName}
                  id="lastName"
                  label="Last name"
                  onChange={(value) => patchDraft('lastName', value)}
                  value={lastName}
                />
              </div>
              <CheckoutField
                autoComplete="tel"
                error={errors.phone}
                id="phone"
                label="Phone"
                onChange={(value) => patchDraft('phone', value)}
                type="tel"
                value={phone}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[1.35rem] font-semibold tracking-tight">
              Pickup location
            </h2>
            {pickupPoints.length === 0 ? (
              <p className="rounded-md border border-neutral-300 px-4 py-3 text-sm text-muted-foreground">
                Pickup is not available right now. Check back shortly.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-neutral-300">
                {pickupPoints.map((point) => {
                  const active = point.id === pickupPointId
                  return (
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 border-b border-neutral-300 px-4 py-3 last:border-0',
                        active && 'bg-neutral-50',
                      )}
                      key={point.id}
                    >
                      <input
                        checked={active}
                        className="mt-1 size-4"
                        name="pickup"
                        onChange={() => setPickupPointId(point.id)}
                        type="radio"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {point.name}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {formatPickupAddress(point)}
                          {point.hours ? (
                            <>
                              <br />
                              {point.hours}
                            </>
                          ) : null}
                          {point.notes ? (
                            <>
                              <br />
                              {point.notes}
                            </>
                          ) : null}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
            {errors.pickup ? (
              <p className="mt-1.5 text-xs text-red-600">{errors.pickup}</p>
            ) : null}
          </section>

          <section>
            <h2 className="text-[1.35rem] font-semibold tracking-tight">Payment</h2>
            <div className="mt-3 space-y-2">
              {paymentDisplay.methods.map((method) => {
                const active = method.id === methodId
                const Icon =
                  method.id === 'qris_va'
                    ? QrCodeIcon
                    : method.id === 'card'
                      ? CreditCardIcon
                      : LockSimpleIcon
                return (
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-3',
                      active && 'bg-neutral-50',
                    )}
                    key={method.id}
                  >
                    <input
                      checked={active}
                      className="mt-1 size-4"
                      name="payment"
                      onChange={() => setMethodId(method.id)}
                      type="radio"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="size-4 shrink-0" />
                        {method.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {method.id === 'card'
                          ? 'Visa, Mastercard, and other cards via DOKU. A service fee applies.'
                          : method.detail}
                      </span>
                    </span>
                    {method.id === 'qris_va' ? (
                      <BankIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    ) : null}
                  </label>
                )
              })}
            </div>
            {errors.payment ? (
              <p className="mt-1.5 text-xs text-red-600">{errors.payment}</p>
            ) : null}
          </section>

          {errors.form ? (
            <p className="text-sm text-red-600">{errors.form}</p>
          ) : null}

          <Button
            className="h-14 w-full rounded-md text-base"
            disabled={pending || pickupPoints.length === 0}
            size="lg"
            type="submit"
          >
            {pending ? (<><Spinner /> Redirecting…</>) : `Pay ${formatShopPrice(total)}`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You’ll be redirected to complete payment.
          </p>
        </form>

        <footer className="mx-auto mt-10 max-w-xl border-t border-border pt-4 text-xs text-sky-800">
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link className="hover:underline" to="/shop">
              Continue shopping
            </Link>
          </nav>
        </footer>
      </div>

      <aside className="hidden border-l border-border bg-neutral-100 px-8 py-10 lg:block lg:px-12">
        <div className="lg:sticky lg:top-10">{summary}</div>
      </aside>
    </div>
  )
}

export function CheckoutConfirmation({ order }: { order: ShopOrder }) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div className="px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Link
          className="mb-10 inline-block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          to="/"
        >
          <img
            alt="Barong Cycling Team"
            className="h-9 w-auto"
            height={36}
            src="/barong_logo.png"
            width={28}
          />
        </Link>

        <div className="mx-auto max-w-xl">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircleIcon className="size-8 text-green-700" weight="fill" />
            Confirmation #{order.id}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
            Thank you, {order.firstName}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your order is confirmed.
          </p>

          <div className="mt-8 overflow-hidden rounded-md border border-neutral-300">
            <div className="border-b border-neutral-300 px-4 py-3">
              <p className="font-medium">Order details</p>
            </div>
            <dl className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="mt-1">
                  {orderCustomerName(order)}
                  <br />
                  {order.email}
                  <br />
                  {order.phone}
                </dd>
              </div>
              <div>
                <p className="text-muted-foreground">Delivery information</p>
                <dl className="mt-3 space-y-3">
                  <div>
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="mt-1">
                      {order.delivery === 'pickup'
                        ? 'Pickup point'
                        : order.shippingLabel}
                    </dd>
                  </div>
                  {order.delivery === 'pickup' ? (
                    <div>
                      <dt className="text-muted-foreground">Pick up point</dt>
                      <dd className="mt-1">{orderPickupPointName(order)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="mt-1">
                      {order.address}
                      <br />
                      {order.city}, {order.province} {order.postal}
                    </dd>
                  </div>
                </dl>
              </div>
            </dl>
          </div>

          <Link
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
            to="/account/orders"
          >
            View orders
          </Link>
        </div>
      </div>

      <aside className="border-t border-border bg-neutral-100 px-5 py-8 lg:border-t-0 lg:border-l lg:px-12 lg:py-12">
        <ConfirmationSummary order={order} />
      </aside>
    </div>
  )
}

export function CheckoutAwaitingPayment({
  order,
  title,
  detail,
}: {
  order: ShopOrder
  title: string
  detail: string
}) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

  async function payAgain() {
    setPending(true)
    setError('')
    try {
      if (order.payment?.checkoutUrl) {
        window.location.assign(order.payment.checkoutUrl)
        return
      }
      const started = await startPayment({ data: { orderNumber: order.id } })
      window.location.assign(started.url)
    } catch (caught) {
      setPending(false)
      setError(
        caught instanceof Error ? caught.message : 'Could not start payment',
      )
    }
  }

  return (
    <div className="min-h-dvh bg-background px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
      <Link
        className="mb-10 inline-block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        to="/"
      >
        <img
          alt="Barong Cycling Team"
          className="h-9 w-auto"
          height={36}
          src="/barong_logo.png"
          width={28}
        />
      </Link>
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-muted-foreground">Order #{order.id}</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {orderNeedsPayment(order) ? (
          <Button
            className="mt-8"
            disabled={pending}
            onClick={() => void payAgain()}
            size="lg"
          >
            {pending ? (<><Spinner /> Redirecting…</>) : `Pay ${formatShopPrice(order.total)}`}
          </Button>
        ) : null}
        <div className="mt-6">
          <Link
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            to="/shop"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

function OrderSummary({
  lines,
  subtotal,
  total,
  delivery,
  serviceFee = 0,
}: {
  lines: CartLine[]
  subtotal: number
  total: number
  delivery: 'pickup' | 'ship'
  serviceFee?: number
}) {
  return (
    <div>
      <ul className="space-y-4">
        {lines.map((line) => (
          <li
            className="flex items-center gap-3"
            key={cartLineKey(line)}
          >
            <div className="relative shrink-0">
              <img
                alt=""
                className="size-16 rounded-md border border-neutral-200 object-cover"
                height={128}
                src={shopImageSrc(line.product.image, 128)}
                width={128}
              />
              <span className="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full bg-neutral-600 px-1 text-[11px] leading-5 text-white">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{line.product.name}</p>
              <p className="text-xs text-muted-foreground">
                {line.product.color} / {line.size}
                {line.product.preOrder ? ' · Pre order' : ''}
              </p>
              {line.custom ? (
                <p className="text-xs text-muted-foreground">
                  {formatCustomMeasurements(line.custom)}
                </p>
              ) : null}
            </div>
            <p className="text-sm tabular-nums">
              {formatShopPrice(line.product.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatShopPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{delivery === 'pickup' ? 'Pickup point' : 'Shipping'}</dt>
          <dd className="tabular-nums">Free</dd>
        </div>
        {serviceFee > 0 ? (
          <div className="flex justify-between">
            <dt>Card service fee</dt>
            <dd className="tabular-nums">{formatShopPrice(serviceFee)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-neutral-300 pt-4">
        <span className="text-base font-medium">Total</span>
        <span>
          <span className="mr-2 text-xs text-muted-foreground">IDR</span>
          <span className="font-heading text-2xl font-semibold tabular-nums">
            {formatShopPrice(total).replace('Rp', '').trim()}
          </span>
        </span>
      </div>
    </div>
  )
}

function ConfirmationSummary({ order }: { order: ShopOrder }) {
  const goodsTotal = Math.max(
    order.subtotal - order.discount + order.shipping,
    0,
  )
  const serviceFee = Math.max(order.total - goodsTotal, 0)

  return (
    <div>
      <ul className="space-y-4">
        {order.lines.map((line) => (
          <li
            className="flex items-center gap-3"
            key={`${line.slug}-${line.size}-${line.custom?.chest ?? ''}`}
          >
            <div className="relative shrink-0">
              <img
                alt=""
                className="size-16 rounded-md border border-neutral-200 object-cover"
                height={128}
                src={shopImageSrc(line.image, 128)}
                width={128}
              />
              <span className="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full bg-neutral-600 px-1 text-[11px] leading-5 text-white">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{line.name}</p>
              <p className="text-xs text-muted-foreground">
                {line.color} / {line.size}
                {line.preOrder ? ' · Pre order' : ''}
              </p>
              {line.custom ? (
                <p className="text-xs text-muted-foreground">
                  {formatCustomMeasurements(line.custom)}
                </p>
              ) : null}
            </div>
            <p className="text-sm tabular-nums">
              {formatShopPrice(line.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatShopPrice(order.subtotal)}</dd>
        </div>
        {order.discount > 0 ? (
          <div className="flex justify-between text-green-700">
            <dt>Discount</dt>
            <dd className="tabular-nums">−{formatShopPrice(order.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt>
            {order.delivery === 'pickup' ? 'Pickup point' : 'Shipping'}
          </dt>
          <dd className="tabular-nums">
            {order.shipping === 0 ? 'Free' : formatShopPrice(order.shipping)}
          </dd>
        </div>
        {serviceFee > 0 ? (
          <div className="flex justify-between">
            <dt>Card service fee</dt>
            <dd className="tabular-nums">{formatShopPrice(serviceFee)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-neutral-300 pt-4">
        <span className="text-base font-medium">Total</span>
        <span className="font-heading text-2xl font-semibold tabular-nums">
          {formatShopPrice(order.total)}
        </span>
      </div>
    </div>
  )
}

function CheckoutField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error,
  inputMode,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  error?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div>
      <div className="relative">
        <input
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={cn(
            'peer h-12 w-full rounded-md border bg-background px-3 pt-3.5 pb-1 text-sm outline-none transition-shadow',
            error
              ? 'border-red-500'
              : 'border-neutral-300 focus:border-foreground focus:ring-1 focus:ring-foreground',
          )}
          id={id}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          placeholder=" "
          type={type}
          value={value}
        />
        <label
          className="pointer-events-none absolute top-1/2 left-3 origin-left -translate-y-1/2 text-sm text-neutral-500 transition-all peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px]"
          htmlFor={id}
        >
          {label}
        </label>
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}


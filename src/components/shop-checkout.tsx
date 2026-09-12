import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CaretDownIcon,
  CheckCircleIcon,
  CreditCardIcon,
  LockSimpleIcon,
  QrCodeIcon,
  ShoppingBagIcon,
} from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import {
  findShopProduct,
  formatCustomMeasurements,
  formatShopPrice,
  shopImageSrc,
  type ShopProduct,
} from '~/data/shop'
import {
  discountAmount as orderDiscountAmount,
  formatPaymentLabel,
  orderNeedsPayment,
  parseDiscountCode,
  SHIPPING_RATES,
  type ShopOrder,
  type ShippingSpeed,
} from '~/data/orders'
import {
  useAccount,
  type AccountShippingAddress,
} from '~/lib/account'
import { cartLineKey, useCart, type CartItem } from '~/lib/cart'
import { placeOrder } from '~/lib/order.functions'
import { startPayment } from '~/lib/payment.functions'
import type { PaymentDisplay } from '~/lib/payment/types'
import { cn } from '~/lib/utils'

type CartLine = CartItem & { product: ShopProduct }

type Discount = {
  code: string
  type: 'percent' | 'fixed'
  value: number
}

const PROVINCES = [
  'Bali',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Yogyakarta',
]

function useCartLines(items: CartItem[], products: ShopProduct[]): CartLine[] {
  return items.flatMap((item) => {
    const product = findShopProduct(products, item.slug)
    if (!product) return []
    return [{ ...item, product }]
  })
}

function discountAmount(subtotal: number, discount: Discount | null) {
  return orderDiscountAmount(subtotal, discount)
}

function shippingAddressComplete(
  address: AccountShippingAddress | null | undefined,
) {
  return Boolean(
    address &&
      address.address.trim() &&
      address.city.trim() &&
      address.postal.trim(),
  )
}

function formatShippingAddress(address: {
  address: string
  apartment?: string
  city: string
  province: string
  postal: string
}) {
  const street = [address.address, address.apartment].filter(Boolean).join(', ')
  const locality = [address.city, address.province, address.postal]
    .filter(Boolean)
    .join(' ')
  return { street, locality }
}

export function ShopCheckout({
  products,
  paymentDisplay,
}: {
  products: ShopProduct[]
  paymentDisplay: PaymentDisplay
}) {
  const navigate = useNavigate()
  const { items, clear, ready } = useCart()
  const {
    profile,
    shippingAddress,
    signedIn,
    ready: accountReady,
    updateShippingAddress,
  } = useAccount()
  const lines = useCartLines(items, products)
  const [pending, setPending] = React.useState(false)
  const [summaryOpen, setSummaryOpen] = React.useState(false)
  const [addressSource, setAddressSource] = React.useState<'saved' | 'new'>(
    'new',
  )

  const [email, setEmail] = React.useState('')
  const [marketing, setMarketing] = React.useState(true)
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [apartment, setApartment] = React.useState('')
  const [city, setCity] = React.useState('')
  const [province, setProvince] = React.useState('Bali')
  const [postal, setPostal] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [shippingSpeed, setShippingSpeed] = React.useState<ShippingSpeed>('regular')
  const [discountInput, setDiscountInput] = React.useState('')
  const [discount, setDiscount] = React.useState<Discount | null>(null)
  const [discountError, setDiscountError] = React.useState('')
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )
  const hasSavedAddress = shippingAddressComplete(shippingAddress)
  const useSavedAddress = hasSavedAddress && addressSource === 'saved'
  const shipping = SHIPPING_RATES[shippingSpeed].price
  const savings = discountAmount(subtotal, discount)
  const total = Math.max(subtotal - savings + shipping, 0)
  const bagCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  React.useEffect(() => {
    if (ready && items.length === 0) {
      void navigate({ to: '/shop/cart' })
    }
  }, [ready, items.length, navigate])

  React.useEffect(() => {
    if (!accountReady || !signedIn || !profile) return
    setEmail(profile.email)
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setPhone(profile.phone)
    if (shippingAddressComplete(shippingAddress)) {
      setAddressSource('saved')
      return
    }
    setAddressSource('new')
  }, [accountReady, signedIn, profile, shippingAddress])

  function applyDiscount(event: React.FormEvent) {
    event.preventDefault()
    const next = parseDiscountCode(discountInput)
    if (!next) {
      setDiscount(null)
      setDiscountError('Enter a valid discount code')
      return
    }
    setDiscountError('')
    setDiscount(next)
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!email.includes('@')) next.email = 'Enter a valid email'
    if (!firstName.trim()) next.firstName = 'Enter a first name'
    if (!lastName.trim()) next.lastName = 'Enter a last name'
    if (!phone.trim()) next.phone = 'Enter a phone number'
    if (!useSavedAddress) {
      if (!address.trim()) next.address = 'Enter an address'
      if (!city.trim()) next.city = 'Enter a city'
      if (!postal.trim()) next.postal = 'Enter a postal code'
    }
    return next
  }

  async function handlePay(event: React.FormEvent) {
    event.preventDefault()
    const next = validate()
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setErrors({})

    const ship = useSavedAddress && shippingAddress
      ? {
          address: shippingAddress.address,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          province: shippingAddress.province,
          postal: shippingAddress.postal,
        }
      : { address, apartment, city, province, postal }

    let shippingAddressId = useSavedAddress ? shippingAddress?.id : undefined
    if (!useSavedAddress) {
      try {
        const saved = await updateShippingAddress(ship)
        shippingAddressId = saved?.id
      } catch {
        setErrors({ address: 'Could not save shipping address' })
        return
      }
    }

    setPending(true)
    try {
      const placed = await placeOrder({
        data: {
          email,
          firstName,
          lastName,
          phone,
          address: ship.address,
          apartment: ship.apartment,
          city: ship.city,
          province: ship.province,
          postal: ship.postal,
          shippingAddressId,
          shippingSpeed,
          discountCode: discount?.code,
          lines: lines.map((item) => ({
            slug: item.slug,
            size: item.size,
            quantity: item.quantity,
            custom: item.custom,
          })),
        },
      })
      clear()
      try {
        const started = await startPayment({
          data: { orderNumber: placed.id },
        })
        window.location.assign(started.url)
      } catch {
        window.location.assign(
          `/shop/checkout/return?order=${encodeURIComponent(placed.id)}`,
        )
      }
    } catch (error) {
      setPending(false)
      setErrors({
        form: error instanceof Error ? error.message : 'Could not place order',
      })
    }
  }

  if (!ready || items.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-sm text-muted-foreground">
        Loading checkout…
      </div>
    )
  }

  const summary = (
    <OrderSummary
      lines={lines}
      subtotal={subtotal}
      shipping={shipping}
      savings={savings}
      total={total}
      discount={discount}
      discountInput={discountInput}
      discountError={discountError}
      onDiscountInput={setDiscountInput}
      onApplyDiscount={applyDiscount}
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
            className="flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            to="/"
          >
            <span className="grid size-8 place-items-center rounded-full bg-foreground font-heading text-sm font-semibold text-background">
              B
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Barong
            </span>
          </Link>
          <Link
            aria-label={
              bagCount > 0
                ? `Bag, ${bagCount} ${bagCount === 1 ? 'item' : 'items'}`
                : 'Bag'
            }
            className="relative text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            to="/shop/cart"
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
          </Link>
        </header>

        <form className="mx-auto max-w-xl space-y-8" onSubmit={handlePay}>
          <section>
            <h2 className="mb-3 text-[1.35rem] font-semibold tracking-tight">Contact</h2>
            <CheckoutField
              autoComplete="email"
              error={errors.email}
              id="email"
              label="Email"
              onChange={setEmail}
              type="email"
              value={email}
            />
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                checked={marketing}
                className="mt-0.5 size-4 rounded-sm border-neutral-300"
                onChange={(event) => setMarketing(event.target.checked)}
                type="checkbox"
              />
              Email me with news and offers
            </label>
          </section>

          <section>
            <h2 className="mb-3 text-[1.35rem] font-semibold tracking-tight">Delivery</h2>
            <div className="grid gap-3">
              <CheckoutSelect
                id="country"
                label="Country/region"
                onChange={() => undefined}
                value="Indonesia"
              >
                <option>Indonesia</option>
              </CheckoutSelect>
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckoutField
                  autoComplete="given-name"
                  error={errors.firstName}
                  id="firstName"
                  label="First name"
                  onChange={setFirstName}
                  value={firstName}
                />
                <CheckoutField
                  autoComplete="family-name"
                  error={errors.lastName}
                  id="lastName"
                  label="Last name"
                  onChange={setLastName}
                  value={lastName}
                />
              </div>
              <CheckoutField
                autoComplete="tel"
                error={errors.phone}
                id="phone"
                label="Phone"
                onChange={setPhone}
                type="tel"
                value={phone}
              />
              {hasSavedAddress && shippingAddress ? (
                <div className="overflow-hidden rounded-md border border-neutral-300">
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 px-4 py-3',
                      useSavedAddress && 'bg-neutral-50',
                    )}
                  >
                    <input
                      checked={useSavedAddress}
                      className="mt-1 size-4"
                      name="address-source"
                      onChange={() => setAddressSource('saved')}
                      type="radio"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {shippingAddress.label || 'Saved address'}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {formatShippingAddress(shippingAddress).street}
                        <br />
                        {formatShippingAddress(shippingAddress).locality}
                      </span>
                    </span>
                  </label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 border-t border-neutral-300 px-4 py-3',
                      !useSavedAddress && 'bg-neutral-50',
                    )}
                  >
                    <input
                      checked={!useSavedAddress}
                      className="mt-1 size-4"
                      name="address-source"
                      onChange={() => setAddressSource('new')}
                      type="radio"
                    />
                    <span className="text-sm font-medium">New address</span>
                  </label>
                </div>
              ) : null}
              {!useSavedAddress ? (
                <>
                  <CheckoutField
                    autoComplete="address-line1"
                    error={errors.address}
                    id="address"
                    label="Address"
                    onChange={setAddress}
                    value={address}
                  />
                  <CheckoutField
                    autoComplete="address-line2"
                    id="apartment"
                    label="Apartment, suite, etc. (optional)"
                    onChange={setApartment}
                    value={apartment}
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <CheckoutField
                      autoComplete="address-level2"
                      error={errors.city}
                      id="city"
                      label="City"
                      onChange={setCity}
                      value={city}
                    />
                    <CheckoutSelect
                      id="province"
                      label="Province"
                      onChange={setProvince}
                      value={province}
                    >
                      {PROVINCES.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </CheckoutSelect>
                    <CheckoutField
                      autoComplete="postal-code"
                      error={errors.postal}
                      id="postal"
                      label="Postal code"
                      onChange={setPostal}
                      value={postal}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section>
              <h2 className="mb-3 text-[1.35rem] font-semibold tracking-tight">
                Shipping method
              </h2>
              <div className="overflow-hidden rounded-md border border-neutral-300">
                {(Object.keys(SHIPPING_RATES) as ShippingSpeed[]).map((speed) => {
                  const option = SHIPPING_RATES[speed]
                  const active = shippingSpeed === speed
                  return (
                    <label
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-4 border-b border-neutral-300 px-4 py-3 last:border-0',
                        active && 'bg-neutral-50',
                      )}
                      key={speed}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          checked={active}
                          className="size-4"
                          name="shipping"
                          onChange={() => setShippingSpeed(speed)}
                          type="radio"
                        />
                        <span>
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {option.detail}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatShopPrice(option.price)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>

          <section>
            <h2 className="text-[1.35rem] font-semibold tracking-tight">Payment</h2>
            <p className="mt-1 mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <LockSimpleIcon className="size-3.5" />
              Pay securely with {paymentDisplay.displayName}.
            </p>
            <div className="overflow-hidden rounded-md border border-neutral-300">
              {paymentDisplay.methods.map((method, index) => {
                const Icon =
                  method.id === 'qris'
                    ? QrCodeIcon
                    : method.id === 'card'
                      ? CreditCardIcon
                      : LockSimpleIcon
                return (
                  <div
                    className={cn(
                      'flex items-start gap-3 px-4 py-3',
                      index < paymentDisplay.methods.length - 1 &&
                        'border-b border-neutral-300',
                    )}
                    key={method.id}
                  >
                    <Icon className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.detail}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {errors.form ? (
            <p className="text-sm text-red-600">{errors.form}</p>
          ) : null}

          <Button
            className="h-14 w-full rounded-md text-base"
            disabled={pending}
            size="lg"
            type="submit"
          >
            {pending ? 'Redirecting…' : `Pay ${formatShopPrice(total)}`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You’ll be redirected to complete payment.
          </p>
        </form>

        <footer className="mx-auto mt-10 max-w-xl border-t border-border pt-4 text-xs text-sky-800">
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <a className="hover:underline" href="#privacy">
              Privacy policy
            </a>
            <a className="hover:underline" href="#terms">
              Terms of service
            </a>
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
          className="mb-10 flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          to="/"
        >
          <span className="grid size-8 place-items-center rounded-full bg-foreground font-heading text-sm font-semibold text-background">
            B
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Barong
          </span>
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
            Your order is confirmed. We’ll email {order.email} and follow up on
            WhatsApp.
          </p>

          <div className="mt-8 overflow-hidden rounded-md border border-neutral-300">
            <div className="border-b border-neutral-300 px-4 py-3">
              <p className="font-medium">Order details</p>
            </div>
            <dl className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="mt-1">
                  {order.email}
                  <br />
                  {order.phone}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ship to</dt>
                <dd className="mt-1">
                  {order.address}
                  <br />
                  {order.city}, {order.province} {order.postal}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Method</dt>
                <dd className="mt-1">{order.shippingLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="mt-1">{formatPaymentLabel(order)}</dd>
              </div>
            </dl>
          </div>

          <Link
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
            to="/shop"
          >
            Continue shopping
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
        className="mb-10 flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        to="/"
      >
        <span className="grid size-8 place-items-center rounded-full bg-foreground font-heading text-sm font-semibold text-background">
          B
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight">
          Barong
        </span>
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
            {pending ? 'Redirecting…' : `Pay ${formatShopPrice(order.total)}`}
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
  shipping,
  savings,
  total,
  discount,
  discountInput,
  discountError,
  onDiscountInput,
  onApplyDiscount,
}: {
  lines: CartLine[]
  subtotal: number
  shipping: number
  savings: number
  total: number
  discount: Discount | null
  discountInput: string
  discountError: string
  onDiscountInput: (value: string) => void
  onApplyDiscount: (event: React.FormEvent) => void
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

      <form className="mt-6 flex gap-2" onSubmit={onApplyDiscount}>
        <div className="min-w-0 flex-1">
          <CheckoutField
            id="discount"
            label="Discount code"
            onChange={onDiscountInput}
            value={discountInput}
          />
        </div>
        <button
          className="h-12 shrink-0 rounded-md bg-neutral-200 px-4 text-sm font-medium disabled:opacity-40"
          disabled={!discountInput.trim()}
          type="submit"
        >
          Apply
        </button>
      </form>
      {discountError ? (
        <p className="mt-1.5 text-xs text-red-600">{discountError}</p>
      ) : null}
      {discount ? (
        <p className="mt-1.5 text-xs text-green-700">
          {discount.code} applied
        </p>
      ) : null}

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatShopPrice(subtotal)}</dd>
        </div>
        {savings > 0 ? (
          <div className="flex justify-between text-green-700">
            <dt>Discount</dt>
            <dd className="tabular-nums">−{formatShopPrice(savings)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="tabular-nums">
            {formatShopPrice(shipping)}
          </dd>
        </div>
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
          <dt>Shipping</dt>
          <dd className="tabular-nums">
            {order.shipping === 0 ? 'Free' : formatShopPrice(order.shipping)}
          </dd>
        </div>
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

function CheckoutSelect({
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
    <div className="relative">
      <select
        className="h-12 w-full appearance-none rounded-md border border-neutral-300 bg-background px-3 pt-3.5 pb-1 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      <label
        className="pointer-events-none absolute top-2.5 left-3 text-[11px] text-neutral-500"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  )
}


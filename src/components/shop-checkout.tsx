import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CaretDownIcon,
  CheckCircleIcon,
  LockSimpleIcon,
  ShoppingBagIcon,
} from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import {
  formatShopPrice,
  getShopProduct,
  shopImageSrc,
  type ShopProduct,
} from '~/data/shop'
import type { ShopOrder } from '~/data/orders'
import { useAccount } from '~/lib/account'
import { useCart, type CartItem } from '~/lib/cart'
import { addPlacedOrder } from '~/lib/orders'
import { cn } from '~/lib/utils'

type CartLine = CartItem & { product: ShopProduct }

type DeliveryMethod = 'ship' | 'pickup'
type ShippingSpeed = 'regular' | 'express'

type Discount = {
  code: string
  type: 'percent' | 'fixed'
  value: number
}

type PlacedOrder = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  delivery: DeliveryMethod
  address: string
  city: string
  province: string
  postal: string
  shippingLabel: string
  lines: CartLine[]
  subtotal: number
  shipping: number
  discount: number
  total: number
}

const PROVINCES = [
  'Bali',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Yogyakarta',
]

const SHIPPING_RATES: Record<ShippingSpeed, { label: string; detail: string; price: number }> = {
  regular: {
    label: 'JNE Regular',
    detail: '2–4 business days',
    price: 35_000,
  },
  express: {
    label: 'JNE YES',
    detail: '1–2 business days',
    price: 55_000,
  },
}

function useCartLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getShopProduct(item.slug)
    if (!product) return []
    return [{ ...item, product }]
  })
}

function discountAmount(subtotal: number, discount: Discount | null) {
  if (!discount) return 0
  if (discount.type === 'percent') {
    return Math.round(subtotal * (discount.value / 100))
  }
  return Math.min(discount.value, subtotal)
}

function parseDiscount(code: string): Discount | null {
  const normalized = code.trim().toUpperCase()
  if (normalized === 'BARONG10') {
    return { code: normalized, type: 'percent', value: 10 }
  }
  if (normalized === 'MELALI') {
    return { code: normalized, type: 'fixed', value: 50_000 }
  }
  return null
}

export function ShopCheckout() {
  const navigate = useNavigate()
  const { items, clear, ready } = useCart()
  const { profile, signedIn, ready: accountReady } = useAccount()
  const lines = useCartLines(items)
  const [order, setOrder] = React.useState<PlacedOrder | null>(null)
  const [summaryOpen, setSummaryOpen] = React.useState(false)

  const [email, setEmail] = React.useState('')
  const [marketing, setMarketing] = React.useState(true)
  const [delivery, setDelivery] = React.useState<DeliveryMethod>('pickup')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [apartment, setApartment] = React.useState('')
  const [city, setCity] = React.useState('')
  const [province, setProvince] = React.useState('Bali')
  const [postal, setPostal] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [shippingSpeed, setShippingSpeed] = React.useState<ShippingSpeed>('regular')
  const [cardNumber, setCardNumber] = React.useState('')
  const [expiry, setExpiry] = React.useState('')
  const [cvv, setCvv] = React.useState('')
  const [cardName, setCardName] = React.useState('')
  const [discountInput, setDiscountInput] = React.useState('')
  const [discount, setDiscount] = React.useState<Discount | null>(null)
  const [discountError, setDiscountError] = React.useState('')
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )
  const shipping =
    delivery === 'pickup' ? 0 : SHIPPING_RATES[shippingSpeed].price
  const savings = discountAmount(subtotal, discount)
  const total = Math.max(subtotal - savings + shipping, 0)
  const bagCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  React.useEffect(() => {
    if (ready && items.length === 0 && !order) {
      void navigate({ to: '/shop/cart' })
    }
  }, [ready, items.length, order, navigate])

  React.useEffect(() => {
    if (!accountReady || !signedIn || !profile) return
    setEmail(profile.email)
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setPhone(profile.phone)
    setAddress(profile.address)
    setApartment(profile.apartment)
    setCity(profile.city)
    if (profile.province) setProvince(profile.province)
    setPostal(profile.postal)
  }, [accountReady, signedIn, profile])

  function applyDiscount(event: React.FormEvent) {
    event.preventDefault()
    const next = parseDiscount(discountInput)
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
    if (delivery === 'ship') {
      if (!address.trim()) next.address = 'Enter an address'
      if (!city.trim()) next.city = 'Enter a city'
      if (!postal.trim()) next.postal = 'Enter a postal code'
    }
    const digits = cardNumber.replace(/\s/g, '')
    if (digits.length < 13) next.cardNumber = 'Enter a card number'
    if (!/^\d{2}\s\/\s\d{2}$/.test(expiry)) next.expiry = 'Enter a valid expiry'
    if (cvv.replace(/\D/g, '').length < 3) next.cvv = 'Enter a CVV'
    if (!cardName.trim()) next.cardName = 'Enter the name on the card'
    return next
  }

  function handlePay(event: React.FormEvent) {
    event.preventDefault()
    const next = validate()
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setErrors({})
    const shippingLabel =
      delivery === 'pickup'
        ? 'Pickup · Denpasar meet point'
        : `${SHIPPING_RATES[shippingSpeed].label} · ${SHIPPING_RATES[shippingSpeed].detail}`
    const id = `BCT-${Math.floor(1000 + Math.random() * 9000)}`
    const placed: ShopOrder = {
      id,
      placedAt: new Date().toISOString(),
      email,
      firstName,
      lastName,
      phone,
      delivery,
      address: [address, apartment].filter(Boolean).join(', '),
      city,
      province,
      postal,
      shippingLabel,
      lines: lines.map((item) => ({
        slug: item.slug,
        name: item.product.name,
        color: item.product.color,
        size: item.size,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image,
      })),
      subtotal,
      shipping,
      discount: savings,
      total,
      status: 'pending',
      payment: 'paid',
    }
    addPlacedOrder(placed)
    setOrder({
      id,
      email,
      firstName,
      lastName,
      phone,
      delivery,
      address: placed.address,
      city,
      province,
      postal,
      shippingLabel,
      lines,
      subtotal,
      shipping,
      discount: savings,
      total,
    })
    clear()
  }

  if (!ready || (items.length === 0 && !order)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-sm text-muted-foreground">
        Loading checkout…
      </div>
    )
  }

  if (order) {
    return <CheckoutConfirmation order={order} />
  }

  const summary = (
    <OrderSummary
      lines={lines}
      subtotal={subtotal}
      shipping={shipping}
      delivery={delivery}
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
            <div className="mb-3 grid grid-cols-2 overflow-hidden rounded-md border border-neutral-300">
              <DeliveryTab
                active={delivery === 'ship'}
                onClick={() => setDelivery('ship')}
              >
                Ship
              </DeliveryTab>
              <DeliveryTab
                active={delivery === 'pickup'}
                onClick={() => setDelivery('pickup')}
              >
                Pickup
              </DeliveryTab>
            </div>

            {delivery === 'pickup' ? (
              <div className="rounded-md border border-neutral-300 p-4">
                <p className="font-medium">Denpasar meet point</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Jalan Raya Sesetan, Denpasar, Bali. Ready in 2–3 days. We’ll
                  confirm on WhatsApp.
                </p>
                <p className="mt-2 text-sm font-medium">Free</p>
              </div>
            ) : null}

            <div className="mt-3 grid gap-3">
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
              {delivery === 'ship' ? (
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
              <CheckoutField
                autoComplete="tel"
                error={errors.phone}
                id="phone"
                label="Phone"
                onChange={setPhone}
                type="tel"
                value={phone}
              />
            </div>
          </section>

          {delivery === 'ship' ? (
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
          ) : null}

          <section>
            <h2 className="text-[1.35rem] font-semibold tracking-tight">Payment</h2>
            <p className="mt-1 mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <LockSimpleIcon className="size-3.5" />
              All transactions are secure and encrypted.
            </p>
            <div className="overflow-hidden rounded-md border border-neutral-300">
              <div className="flex items-center justify-between bg-neutral-50 px-4 py-3">
                <span className="text-sm font-medium">Credit card</span>
                <span className="text-[11px] tracking-wide text-muted-foreground">
                  Visa · Mastercard · Amex
                </span>
              </div>
              <div className="grid gap-3 p-3">
                <CheckoutField
                  autoComplete="cc-number"
                  error={errors.cardNumber}
                  id="cardNumber"
                  inputMode="numeric"
                  label="Card number"
                  onChange={(value) => setCardNumber(formatCardNumber(value))}
                  value={cardNumber}
                />
                <div className="grid grid-cols-2 gap-3">
                  <CheckoutField
                    autoComplete="cc-exp"
                    error={errors.expiry}
                    id="expiry"
                    label="Expiration date (MM / YY)"
                    onChange={(value) => setExpiry(formatExpiry(value))}
                    value={expiry}
                  />
                  <CheckoutField
                    autoComplete="cc-csc"
                    error={errors.cvv}
                    id="cvv"
                    inputMode="numeric"
                    label="Security code"
                    onChange={(value) => setCvv(value.replace(/\D/g, '').slice(0, 4))}
                    value={cvv}
                  />
                </div>
                <CheckoutField
                  autoComplete="cc-name"
                  error={errors.cardName}
                  id="cardName"
                  label="Name on card"
                  onChange={setCardName}
                  value={cardName}
                />
              </div>
            </div>
          </section>

          <Button className="h-14 w-full rounded-md text-base" size="lg" type="submit">
            Pay now
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This is a demo checkout. No payment is taken.
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

function CheckoutConfirmation({ order }: { order: PlacedOrder }) {
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
                <dt className="text-muted-foreground">
                  {order.delivery === 'pickup' ? 'Pickup' : 'Ship to'}
                </dt>
                <dd className="mt-1">
                  {order.delivery === 'pickup' ? (
                    'Denpasar meet point, Jalan Raya Sesetan'
                  ) : (
                    <>
                      {order.address}
                      <br />
                      {order.city}, {order.province} {order.postal}
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Method</dt>
                <dd className="mt-1">{order.shippingLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="mt-1">Credit card · {formatShopPrice(order.total)}</dd>
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

function OrderSummary({
  lines,
  subtotal,
  shipping,
  delivery,
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
  delivery: DeliveryMethod
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
            key={`${line.slug}-${line.size}`}
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
              </p>
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
            {delivery === 'pickup' ? 'Free' : formatShopPrice(shipping)}
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

function ConfirmationSummary({ order }: { order: PlacedOrder }) {
  return (
    <div>
      <ul className="space-y-4">
        {order.lines.map((line) => (
          <li
            className="flex items-center gap-3"
            key={`${line.slug}-${line.size}`}
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
              </p>
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

function DeliveryTab({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'h-12 text-sm font-medium',
        active ? 'bg-neutral-100' : 'bg-background text-muted-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
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

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`
}

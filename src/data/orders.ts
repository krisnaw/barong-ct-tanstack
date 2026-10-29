export const orderStatuses = [
  'pending',
  'paid',
  'ready',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
  'expire_payment',
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export const adminStatusOptions = [
  'pending',
  'paid',
  'ready',
  'completed',
] as const
export type AdminOrderStatus = (typeof adminStatusOptions)[number]

export type OrderPayment = 'unpaid' | 'paid'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'
export type OrderPaymentStatus = OrderPayment | PaymentStatus
export type OrderDelivery = 'ship' | 'pickup'
export type ShippingSpeed = 'regular' | 'express'

export type ShopPayment = {
  provider: string
  transactionId: string
  status: PaymentStatus
  method?: string
  amount: number
  checkoutUrl?: string
  paidAt?: string
}

export type ShopOrderLine = {
  slug: string
  name: string
  color: string
  size: string
  quantity: number
  price: number
  image: string
  custom?: {
    chest: string
    sleeve: string
    frontZipper: string
    back: string
  }
  preOrder?: boolean
}

export type ShopOrder = {
  id: string
  placedAt: string
  email: string
  firstName: string
  lastName: string
  phone: string
  delivery: OrderDelivery
  pickupPointId?: string
  address: string
  city: string
  province: string
  postal: string
  shippingLabel: string
  courier?: string
  trackingNumber?: string
  pickedUpAt?: string
  lines: ShopOrderLine[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  payment: ShopPayment | null
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  ready: 'Ready to collect',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  expire_payment: 'Expire Payment',
}

export const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  paid: 'bg-teal-50 text-teal-800',
  ready: 'bg-indigo-50 text-indigo-800',
  processing: 'bg-sky-50 text-sky-800',
  shipped: 'bg-indigo-50 text-indigo-800',
  delivered: 'bg-violet-50 text-violet-800',
  completed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-zinc-100 text-zinc-600',
  refunded: 'bg-rose-50 text-rose-800',
  expire_payment: 'bg-zinc-100 text-zinc-600',
}

export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === 'packed') return 'processing'
  if ((orderStatuses as readonly string[]).includes(status)) {
    return status as OrderStatus
  }
  return 'pending'
}

export function resolveOrderStatus(
  status: string,
  paymentStatus?: PaymentStatus | null,
): OrderStatus {
  const mapped = normalizeOrderStatus(status)
  if (mapped === 'pending' && paymentStatus === 'paid') return 'paid'
  if (mapped === 'pending' && paymentStatus === 'expired') return 'expire_payment'
  return mapped
}

export function orderStatusLabel(status: OrderStatus) {
  return orderStatusLabels[status]
}

export const couriers = [
  { id: 'jne', label: 'JNE' },
  { id: 'tiki', label: 'TIKI' },
  { id: 'jnt', label: 'J&T Express' },
] as const

export type CourierId = (typeof couriers)[number]['id']

export const courierIds = ['jne', 'tiki', 'jnt'] as const

export function courierLabel(id: string) {
  return couriers.find((courier) => courier.id === id)?.label ?? id
}

export function courierTrackingUrl(courier: string, trackingNumber: string) {
  const encoded = encodeURIComponent(trackingNumber)
  if (courier === 'jne') return `https://cekresi.com/?noawb=${encoded}`
  if (courier === 'tiki') return `https://www.tiki.id/id/tracking?cn=${encoded}`
  if (courier === 'jnt') {
    return `https://www.jtexpress.co.id/en/track?billcode=${encoded}`
  }
  return `https://cekresi.com/?noawb=${encoded}`
}

export const SHIPPING_RATES: Record<
  ShippingSpeed,
  { label: string; detail: string; price: number }
> = {
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

export function discountAmount(
  subtotal: number,
  discount: { type: 'percent' | 'fixed'; value: number } | null,
) {
  if (!discount) return 0
  if (discount.type === 'percent') {
    return Math.round(subtotal * (discount.value / 100))
  }
  return Math.min(discount.value, subtotal)
}

export function orderCustomerName(order: ShopOrder) {
  return `${order.firstName} ${order.lastName}`.trim()
}

export function orderPickupPointName(order: ShopOrder) {
  if (order.delivery !== 'pickup') return undefined
  return order.shippingLabel.replace(/^Pickup · /, '').split(' · ')[0]
}

export function orderItemCount(order: ShopOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function orderPaymentStatus(order: ShopOrder): OrderPaymentStatus {
  return order.payment?.status ?? 'unpaid'
}

export function orderNeedsPayment(order: ShopOrder) {
  return order.status === 'pending'
}

const paymentProviderLabels: Record<string, string> = {
  stub: 'Test payment',
  doku: 'DOKU',
  manual: 'Manual',
}

export function formatPaymentLabel(order: ShopOrder) {
  const payment = order.payment
  if (!payment?.method) return '-'
  const provider = paymentProviderLabels[payment.provider] ?? payment.provider
  return [provider, payment.method].filter(Boolean).join(' · ')
}

const SHOP_TIME_ZONE = 'Asia/Makassar'
/** Asia/Makassar is UTC+8 year-round. */
const SHOP_UTC_OFFSET_HOURS = 8

export function formatOrderDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: SHOP_TIME_ZONE,
  }).format(new Date(iso))
}

/** Monday 00:00 through the following Monday 00:00 in Asia/Makassar. `end` is exclusive. */
export function shopWeekBounds(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  const year = value('year')
  const month = value('month')
  const day = value('day')
  const daysFromMonday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7
  const start = new Date(
    Date.UTC(year, month - 1, day - daysFromMonday, -SHOP_UTC_OFFSET_HOURS),
  )
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  return { start, end }
}

export function orderPlacedThisWeek(iso: string, now: Date = new Date()) {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return false
  const { start, end } = shopWeekBounds(now)
  return time >= start.getTime() && time < end.getTime()
}

export function formatShopWeekLabel(now: Date = new Date()) {
  const { start, end } = shopWeekBounds(now)
  const last = new Date(end.getTime() - 1)
  return `${formatOrderDate(start.toISOString())} – ${formatOrderDate(last.toISOString())}`
}

export function formatInvoiceDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: SHOP_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatInvoiceNumber(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`
}

export const orderStatuses = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
  'expire_payment',
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export const adminStatusOptions = ['pending', 'paid', 'completed'] as const
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
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  expire_payment: 'Expire Payment',
}

export const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  paid: 'border-teal-200 bg-teal-50 text-teal-800',
  processing: 'border-sky-200 bg-sky-50 text-sky-800',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  delivered: 'border-violet-200 bg-violet-50 text-violet-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-zinc-200 bg-zinc-100 text-zinc-600',
  refunded: 'border-rose-200 bg-rose-50 text-rose-800',
  expire_payment: 'border-zinc-200 bg-zinc-100 text-zinc-600',
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

export function parseDiscountCode(code: string) {
  const normalized = code.trim().toUpperCase()
  if (normalized === 'BARONG10') {
    return { code: normalized, type: 'percent' as const, value: 10 }
  }
  if (normalized === 'MELALI') {
    return { code: normalized, type: 'fixed' as const, value: 50_000 }
  }
  return null
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

export function formatOrderDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(new Date(iso))
}

export function formatInvoiceDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Makassar',
  }).format(new Date(iso))
}

export function formatInvoiceNumber(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
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

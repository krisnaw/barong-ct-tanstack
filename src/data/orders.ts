export type OrderStatus =
  | 'pending'
  | 'packed'
  | 'shipped'
  | 'completed'
  | 'cancelled'

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
  address: string
  city: string
  province: string
  postal: string
  shippingLabel: string
  lines: ShopOrderLine[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  payment: ShopPayment | null
}

export const orderStatuses: OrderStatus[] = [
  'pending',
  'packed',
  'shipped',
  'completed',
  'cancelled',
]

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

export function orderItemCount(order: ShopOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function orderPaymentStatus(order: ShopOrder): OrderPaymentStatus {
  return order.payment?.status ?? 'unpaid'
}

export function orderNeedsPayment(order: ShopOrder) {
  const status = orderPaymentStatus(order)
  return status !== 'paid'
}

const paymentProviderLabels: Record<string, string> = {
  stub: 'Test payment',
  doku: 'DOKU',
  manual: 'Manual',
}

export function formatPaymentLabel(order: ShopOrder) {
  if (!order.payment) return 'Unpaid'
  const provider =
    paymentProviderLabels[order.payment.provider] ?? order.payment.provider
  const method = order.payment.method
  if (order.payment.status === 'paid') {
    return [provider, method].filter(Boolean).join(' · ')
  }
  return order.payment.status
}

export function formatOrderDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(new Date(iso))
}

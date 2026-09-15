import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { db } from '~/lib/db'
import { orders, payment } from '~/lib/order-schema'
import { applyPaymentEvent } from '~/lib/payment/apply-event'
import {
  checkoutPayloadJson,
  isCheckoutExpired,
  parseCheckoutPayload,
} from '~/lib/payment/checkout-payload'
import {
  getPaymentDisplay as readPaymentDisplay,
  getProvider,
  getProviderName,
} from '~/lib/payment/get-provider'
import { DOKU_PAYMENT_DUE_MINUTES } from '~/lib/payment/providers/doku'
import { appOriginUrl } from '~/lib/payment/public-url'

async function requireSession() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

async function loadOwnedOrder(orderNumber: string, userId: string, role?: string | null) {
  const row = await db.query.orders.findFirst({
    where: eq(orders.number, orderNumber),
    with: { lines: true, payments: true },
  })
  if (!row) {
    throw new Error('Order not found')
  }
  if (row.userId !== userId && !hasAdminRole(role)) {
    throw new Error('Unauthorized')
  }
  return row
}

function paymentCreatedAt(row: typeof payment.$inferSelect) {
  return row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt)
}

function latestPendingPayment(
  rows: (typeof payment.$inferSelect)[],
  providerName: string,
) {
  return (
    [...rows]
      .filter((row) => row.provider === providerName && row.status === 'pending')
      .sort((a, b) => paymentCreatedAt(b) - paymentCreatedAt(a))[0] ?? null
  )
}

function reusableCheckoutUrl(
  row: typeof payment.$inferSelect,
  orderNumber: string,
  providerName: string,
) {
  const stored = parseCheckoutPayload(row.payload)
  const fallbackMinutes =
    providerName === 'doku' ? DOKU_PAYMENT_DUE_MINUTES : 60
  if (isCheckoutExpired(stored.expiresAt, row.createdAt, fallbackMinutes)) {
    return null
  }
  if (stored.checkoutUrl) return stored.checkoutUrl
  if (providerName === 'stub') {
    const base = appOriginUrl()
    return `${base}/shop/checkout/simulate?order=${encodeURIComponent(orderNumber)}`
  }
  return null
}

export const getPaymentDisplay = createServerFn({ method: 'GET' }).handler(
  async () => readPaymentDisplay(),
)

export const startPayment = createServerFn({ method: 'POST' })
  .validator(z.object({ orderNumber: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const order = await loadOwnedOrder(
      data.orderNumber,
      session.user.id,
      session.user.role,
    )
    if (order.payments.some((row) => row.status === 'paid')) {
      throw new Error('Order is already paid')
    }

    const provider = getProvider()
    const existing = latestPendingPayment(order.payments, provider.name)
    if (existing) {
      const url = reusableCheckoutUrl(existing, order.number, provider.name)
      if (url) {
        return { url }
      }
      await db
        .update(payment)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(payment.id, existing.id))
    }

    const base = appOriginUrl()
    const sessionCheckout = await provider.createCheckout({
      orderNumber: order.number,
      amount: order.total,
      currency: 'IDR',
      customer: {
        email: order.email,
        firstName: order.firstName,
        lastName: order.lastName,
        phone: order.phone,
      },
      items: order.lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        price: line.price,
      })),
      returnUrl: `${base}/shop/checkout/return?order=${encodeURIComponent(order.number)}`,
      cancelUrl: `${base}/shop/checkout/cancel?order=${encodeURIComponent(order.number)}`,
    })

    await db.insert(payment).values({
      id: crypto.randomUUID(),
      orderId: order.id,
      provider: provider.name,
      transactionId: sessionCheckout.transactionId,
      status: 'pending',
      amount: order.total,
      payload: checkoutPayloadJson({
        checkoutUrl: sessionCheckout.url,
        expiresAt: sessionCheckout.expiresAt,
      }),
    })

    return { url: sessionCheckout.url }
  })

export const simulateStubPayment = createServerFn({ method: 'POST' })
  .validator(z.object({ orderNumber: z.string().min(1) }))
  .handler(async ({ data }) => {
    if (getProviderName() !== 'stub') {
      throw new Error('Stub payment is not enabled')
    }
    const session = await requireSession()
    const order = await loadOwnedOrder(
      data.orderNumber,
      session.user.id,
      session.user.role,
    )
    const current =
      [...order.payments]
        .filter((row) => row.provider === 'stub')
        .sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt)
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt)
          return bTime - aTime
        })[0] ?? null
    if (!current) {
      throw new Error('No payment to simulate')
    }
    await applyPaymentEvent('stub', {
      transactionId: current.transactionId,
      status: 'paid',
      method: 'qris',
      payload: { source: 'simulate' },
    })
    return { ok: true as const }
  })

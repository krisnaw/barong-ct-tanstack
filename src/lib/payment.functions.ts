import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from 'db'
import { eventParticipant, eventPromo } from 'db/schemas/event'
import { orders, payment } from 'db/schemas/order'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { applyPaymentEvent } from '~/lib/payment/apply-event'
import { isCheckoutExpired } from '~/lib/payment/expiry'
import { chargeAmountForMethod, dokuCardServiceFee } from '~/lib/payment/doku-card-fee'
import {
  getPaymentDisplay as readPaymentDisplay,
  getProvider,
  getProviderName,
} from '~/lib/payment/get-provider'
import { DOKU_PAYMENT_DUE_MINUTES } from '~/lib/payment/providers/doku'
import { appOriginUrl, checkoutOriginUrl } from '~/lib/payment/public-url'
import { PAYMENT_METHOD_IDS } from '~/lib/payment/types'
import { sendEventRegisteredEmail } from '~/lib/email/event-registered'

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
  const fallbackMinutes =
    providerName === 'doku' ? DOKU_PAYMENT_DUE_MINUTES : 60
  if (isCheckoutExpired(row.expiresAt, row.createdAt, fallbackMinutes)) {
    return null
  }
  if (row.checkoutUrl) return row.checkoutUrl
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
  .validator(
    z.object({
      orderNumber: z.string().min(1),
      methodId: z.enum(PAYMENT_METHOD_IDS).default('qris_va'),
    }),
  )
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
    const goodsTotal = Math.max(
      order.subtotal - order.discount + order.shipping,
      0,
    )
    const serviceFee =
      data.methodId === 'card' ? dokuCardServiceFee(goodsTotal) : 0
    const chargeAmount = chargeAmountForMethod(goodsTotal, data.methodId)

    const existing = latestPendingPayment(order.payments, provider.name)
    if (existing) {
      const sameMethod =
        !existing.method ||
        existing.method === data.methodId ||
        // Legacy rows may store channel names from older checkouts
        (data.methodId === 'qris_va' &&
          (existing.method === 'qris' ||
            existing.method === 'va' ||
            existing.method === 'bni_va')) ||
        (data.methodId === 'card' && existing.method === 'card')
      const sameAmount = existing.amount === chargeAmount
      const url =
        sameMethod && sameAmount
          ? reusableCheckoutUrl(existing, order.number, provider.name)
          : null
      if (url) {
        return { url }
      }
      await db
        .update(payment)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(payment.id, existing.id))
    }

    if (order.total !== chargeAmount) {
      await db
        .update(orders)
        .set({ total: chargeAmount, updatedAt: new Date() })
        .where(eq(orders.id, order.id))
    }

    const base = checkoutOriginUrl()
    const returnUrl = `${base}/shop/checkout/return?order=${encodeURIComponent(order.number)}`
    const cancelUrl = `${base}/shop/checkout/cancel?order=${encodeURIComponent(order.number)}`
    const items = [
      ...order.lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        price: line.price,
      })),
      ...(serviceFee > 0
        ? [
            {
              name: 'Card service fee',
              quantity: 1,
              price: serviceFee,
            },
          ]
        : []),
    ]
    const sessionCheckout = await provider.createCheckout({
      orderNumber: order.number,
      amount: chargeAmount,
      currency: 'IDR',
      methodId: data.methodId,
      customer: {
        email: order.email,
        firstName: order.firstName,
        lastName: order.lastName,
        phone: order.phone,
      },
      items,
      returnUrl,
      cancelUrl,
    })

    await db.insert(payment).values({
      id: crypto.randomUUID(),
      orderId: order.id,
      provider: provider.name,
      transactionId: sessionCheckout.transactionId,
      status: 'pending',
      method: data.methodId,
      amount: chargeAmount,
      currency: 'IDR',
      checkoutUrl: sessionCheckout.url,
      expiresAt: sessionCheckout.expiresAt ?? null,
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
      method: current.method ?? 'qris_va',
    })
    return { ok: true as const }
  })

function eventInvoiceRef(participantId: string) {
  return `EVT${participantId.replaceAll('-', '').slice(0, 16)}`
}

function splitName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { firstName: 'Rider', lastName: 'Barong' }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return {
    firstName: firstName || 'Rider',
    lastName: rest.join(' ') || 'Barong',
  }
}

export const startEventPayment = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      participantId: z.string().min(1),
      methodId: z.enum(PAYMENT_METHOD_IDS).default('qris_va'),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession()
    const participant = await db.query.eventParticipant.findFirst({
      where: eq(eventParticipant.id, data.participantId),
      with: {
        event: true,
        user: {
          with: {
            profile: true,
          },
        },
        category: true,
      },
    })
    if (!participant) {
      throw new Error('Registration not found')
    }
    if (
      participant.userId !== session.user.id &&
      !hasAdminRole(session.user.role)
    ) {
      throw new Error('Unauthorized')
    }
    if (participant.status === 'confirmed') {
      throw new Error('Registration is already confirmed')
    }
    if (!participant.event || participant.event.status !== 'open') {
      throw new Error('Registration is not open for this event')
    }

    const goodsTotal = Math.max(participant.finalPrice, 0)
    if (goodsTotal <= 0) {
      const wasConfirmed = participant.status === 'confirmed'
      await db
        .update(eventParticipant)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(eventParticipant.id, participant.id))
      if (participant.promoId && !wasConfirmed) {
        const promo = await db.query.eventPromo.findFirst({
          where: eq(eventPromo.id, participant.promoId),
        })
        if (promo) {
          await db
            .update(eventPromo)
            .set({
              usedCount: promo.usedCount + 1,
              updatedAt: new Date(),
            })
            .where(eq(eventPromo.id, promo.id))
        }
      }
      if (!wasConfirmed) {
        try {
          await sendEventRegisteredEmail(participant.id)
        } catch (error) {
          console.error('Failed to send event registration email', error)
        }
      }
      return { url: null as string | null, confirmed: true as const }
    }

    const provider = getProvider()
    const chargeAmount = goodsTotal
    const invoiceRef = eventInvoiceRef(participant.id)

    const pendingRows = await db.query.payment.findMany({
      where: and(
        eq(payment.participantId, participant.id),
        eq(payment.provider, provider.name),
        eq(payment.status, 'pending'),
      ),
    })
    const existing = latestPendingPayment(pendingRows, provider.name)
    if (existing) {
      const sameMethod =
        !existing.method ||
        existing.method === data.methodId ||
        (data.methodId === 'qris_va' &&
          (existing.method === 'qris' ||
            existing.method === 'va' ||
            existing.method === 'bni_va')) ||
        (data.methodId === 'card' && existing.method === 'card')
      const sameAmount = existing.amount === chargeAmount
      const reusable =
        sameMethod && sameAmount
          ? reusableCheckoutUrl(existing, invoiceRef, provider.name)
          : null
      if (reusable) {
        const url =
          provider.name === 'stub'
            ? `${appOriginUrl()}/events/${participant.event.slug}/payment/simulate?participant=${encodeURIComponent(participant.id)}`
            : reusable
        return { url, confirmed: false as const }
      }
      await db
        .update(payment)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(payment.id, existing.id))
    }

    if (participant.status !== 'pending_payment') {
      await db
        .update(eventParticipant)
        .set({ status: 'pending_payment', updatedAt: new Date() })
        .where(eq(eventParticipant.id, participant.id))
    }

    const profile = participant.user.profile
    const names = splitName(
      `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() ||
        participant.user.name,
    )
    const phone = profile?.phone?.trim() || ''
    if (!phone) {
      throw new Error('Phone number is required for payment')
    }

    const base = checkoutOriginUrl()
    const returnUrl = `${base}/events/${participant.event.slug}?payment=return`
    const cancelUrl = `${base}/events/${participant.event.slug}/register?step=payment`
    const entryPrice = Math.max(
      participant.price - participant.discountAmount,
      0,
    )
    const items = [
      {
        name: participant.category?.name
          ? `${participant.event.name} - ${participant.category.name}`
          : participant.event.name,
        quantity: 1,
        price: entryPrice,
      },
      ...(participant.serviceFee > 0
        ? [
            {
              name: 'Service fee',
              quantity: 1,
              price: participant.serviceFee,
            },
          ]
        : []),
    ]

    const sessionCheckout = await provider.createCheckout({
      orderNumber: invoiceRef,
      amount: chargeAmount,
      currency: 'IDR',
      methodId: data.methodId,
      customer: {
        email: participant.user.email,
        firstName: names.firstName,
        lastName: names.lastName,
        phone,
      },
      items,
      returnUrl,
      cancelUrl,
    })

    const checkoutUrl =
      provider.name === 'stub'
        ? `${appOriginUrl()}/events/${participant.event.slug}/payment/simulate?participant=${encodeURIComponent(participant.id)}`
        : sessionCheckout.url

    await db.insert(payment).values({
      id: crypto.randomUUID(),
      orderId: null,
      participantId: participant.id,
      provider: provider.name,
      transactionId: sessionCheckout.transactionId,
      status: 'pending',
      method: data.methodId,
      amount: chargeAmount,
      currency: 'IDR',
      checkoutUrl,
      expiresAt: sessionCheckout.expiresAt ?? null,
    })

    return { url: checkoutUrl, confirmed: false as const }
  })

export const simulateStubEventPayment = createServerFn({ method: 'POST' })
  .validator(z.object({ participantId: z.string().min(1) }))
  .handler(async ({ data }) => {
    if (getProviderName() !== 'stub') {
      throw new Error('Stub payment is not enabled')
    }
    const session = await requireSession()
    const participant = await db.query.eventParticipant.findFirst({
      where: eq(eventParticipant.id, data.participantId),
      with: {
        event: true,
      },
    })
    if (!participant) {
      throw new Error('Registration not found')
    }
    if (
      participant.userId !== session.user.id &&
      !hasAdminRole(session.user.role)
    ) {
      throw new Error('Unauthorized')
    }

    const payments = await db.query.payment.findMany({
      where: and(
        eq(payment.participantId, participant.id),
        eq(payment.provider, 'stub'),
      ),
    })
    const current =
      [...payments].sort((a, b) => paymentCreatedAt(b) - paymentCreatedAt(a))[0] ??
      null
    if (!current) {
      throw new Error('No payment to simulate')
    }

    await applyPaymentEvent('stub', {
      transactionId: current.transactionId,
      status: 'paid',
      method: current.method ?? 'qris_va',
    })

    return {
      ok: true as const,
      eventSlug: participant.event?.slug ?? null,
    }
  })

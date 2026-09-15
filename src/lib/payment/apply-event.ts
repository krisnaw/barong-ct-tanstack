import { and, eq } from 'drizzle-orm'
import { db } from '~/lib/db'
import { sendOrderPaidEmail } from '~/lib/email/order-paid'
import { loadShopOrderByDbId } from '~/lib/order-load'
import { orders, payment } from '~/lib/order-schema'
import { mergePaymentPayload } from '~/lib/payment/checkout-payload'
import type { PaymentEvent } from '~/lib/payment/types'

export async function applyPaymentEvent(
  provider: string,
  event: PaymentEvent,
) {
  const row = await db.query.payment.findFirst({
    where: and(
      eq(payment.provider, provider),
      eq(payment.transactionId, event.transactionId),
    ),
  })
  if (!row) return null
  if (row.status === 'paid') return row

  const paidAt = event.status === 'paid' ? new Date() : null
  await db
    .update(payment)
    .set({
      status: event.status,
      method: event.method ?? row.method,
      payload: event.payload
        ? mergePaymentPayload(row.payload, event.payload)
        : row.payload,
      paidAt,
      updatedAt: new Date(),
    })
    .where(eq(payment.id, row.id))

  if (event.status === 'paid' || event.status === 'expired') {
    const orderRow = await db.query.orders.findFirst({
      where: eq(orders.id, row.orderId),
    })
    if (
      orderRow &&
      (orderRow.status === 'pending' || orderRow.status === 'packed')
    ) {
      await db
        .update(orders)
        .set({
          status: event.status === 'paid' ? 'paid' : 'expire_payment',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, row.orderId))
    }
  }

  if (event.status === 'paid') {
    try {
      const order = await loadShopOrderByDbId(row.orderId)
      if (order) await sendOrderPaidEmail(order)
    } catch (error) {
      console.error('Failed to send order paid email', error)
    }
  }

  return {
    ...row,
    status: event.status,
    method: event.method ?? row.method,
    paidAt,
  }
}

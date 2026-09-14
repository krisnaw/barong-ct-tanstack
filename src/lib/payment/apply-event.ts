import { and, eq } from 'drizzle-orm'
import { db } from '~/lib/db'
import { orders, payment } from '~/lib/order-schema'
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
      payload: event.payload ? JSON.stringify(event.payload) : row.payload,
      paidAt,
      updatedAt: new Date(),
    })
    .where(eq(payment.id, row.id))

  if (event.status === 'paid') {
    const orderRow = await db.query.orders.findFirst({
      where: eq(orders.id, row.orderId),
    })
    if (
      orderRow &&
      (orderRow.status === 'pending' || orderRow.status === 'packed')
    ) {
      await db
        .update(orders)
        .set({ status: 'paid', updatedAt: new Date() })
        .where(eq(orders.id, row.orderId))
    }
  }

  return {
    ...row,
    status: event.status,
    method: event.method ?? row.method,
    paidAt,
  }
}

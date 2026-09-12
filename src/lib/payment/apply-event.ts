import { and, eq } from 'drizzle-orm'
import { db } from '~/lib/db'
import { payment } from '~/lib/order-schema'
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

  return {
    ...row,
    status: event.status,
    method: event.method ?? row.method,
    paidAt,
  }
}

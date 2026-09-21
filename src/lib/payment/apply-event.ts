import { and, eq } from 'drizzle-orm'
import { db } from 'db'
import { loadShopOrderByDbId } from 'db/query/order-load'
import { eventParticipant, eventPromo } from 'db/schemas/event'
import { orders, payment } from 'db/schemas/order'
import { sendEventRegisteredEmail } from '~/lib/email/event-registered'
import { sendOrderPaidEmail } from '~/lib/email/order-paid'
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
      paidAt,
      updatedAt: new Date(),
    })
    .where(eq(payment.id, row.id))

  if (event.status === 'paid' || event.status === 'expired') {
    if (row.orderId) {
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

    if (row.participantId) {
      const participant = await db.query.eventParticipant.findFirst({
        where: eq(eventParticipant.id, row.participantId),
      })
      const wasConfirmed = participant?.status === 'confirmed'
      await db
        .update(eventParticipant)
        .set({
          status: event.status === 'paid' ? 'confirmed' : 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(eventParticipant.id, row.participantId))

      if (
        event.status === 'paid' &&
        participant?.promoId &&
        !wasConfirmed
      ) {
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

      if (event.status === 'paid' && !wasConfirmed) {
        try {
          await sendEventRegisteredEmail(row.participantId)
        } catch (error) {
          console.error('Failed to send event registration email', error)
        }
      }
    }
  }

  if (event.status === 'paid' && row.orderId) {
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

import { and, asc, eq, inArray, isNotNull, lt } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { db } from '~/lib/db'
import { event, eventParticipant } from '~/lib/event-schema'
import { payment } from '~/lib/order-schema'
import { applyPaymentEvent } from '~/lib/payment/apply-event'
import { isCheckoutExpired } from '~/lib/payment/expiry'
import {
  checkDokuPaymentStatus,
  DOKU_PAYMENT_DUE_MINUTES,
} from '~/lib/payment/providers/doku'

function dokuConfigured() {
  return Boolean(env.DOKU_API_URL && env.DOKU_CLIENT_ID && env.DOKU_SECRET_KEY)
}

function paymentCreatedAt(row: typeof payment.$inferSelect) {
  return row.createdAt instanceof Date
    ? row.createdAt.getTime()
    : Number(row.createdAt)
}

function isPaymentPastDue(row: typeof payment.$inferSelect) {
  return isCheckoutExpired(
    row.expiresAt,
    row.createdAt,
    DOKU_PAYMENT_DUE_MINUTES,
  )
}

async function resolvePastDueStatus(row: typeof payment.$inferSelect) {
  if (row.provider === 'doku' && dokuConfigured()) {
    const event = await checkDokuPaymentStatus(row.transactionId)
    return {
      status: (event?.status === 'paid' ? 'paid' : 'expired') as
        | 'paid'
        | 'expired',
      method: event?.method ?? row.method ?? undefined,
    }
  }

  return {
    status: 'expired' as const,
    method: row.method ?? undefined,
  }
}

async function hasOpenPaidEvent() {
  const row = await db.query.event.findFirst({
    where: and(
      eq(event.status, 'open'),
      inArray(event.kind, ['paid', 'flagship']),
    ),
    columns: { id: true },
  })
  return Boolean(row)
}

/** Expire or confirm overdue shop checkout payments. */
export async function syncPendingPayments() {
  const cutoff = new Date(Date.now() - DOKU_PAYMENT_DUE_MINUTES * 60 * 1000)
  const rows = await db.query.payment.findMany({
    where: and(
      isNotNull(payment.orderId),
      eq(payment.status, 'pending'),
      lt(payment.createdAt, cutoff),
    ),
    orderBy: [asc(payment.createdAt)],
    limit: 50,
  })

  let updated = 0
  for (const row of rows) {
    if (!isPaymentPastDue(row)) continue
    try {
      const resolved = await resolvePastDueStatus(row)
      await applyPaymentEvent(row.provider, {
        transactionId: row.transactionId,
        status: resolved.status,
        method: resolved.method,
      })
      updated += 1
    } catch (error) {
      console.error('payment status check failed', row.transactionId, error)
    }
  }

  return { checked: rows.length, updated }
}

/**
 * Check unpaid paid-event registrations past the payment due window.
 * Confirms paid checkouts via DOKU when configured; otherwise expires them
 * and cancels stuck pending_payment participants.
 * Skips entirely when no open paid/flagship event exists.
 */
export async function syncUnpaidEventPayments() {
  if (!(await hasOpenPaidEvent())) {
    return {
      skipped: true as const,
      reason: 'no_open_paid_event' as const,
      checked: 0,
      updated: 0,
      reconciled: 0,
      confirmed: 0,
      cancelled: 0,
    }
  }

  const cutoff = new Date(Date.now() - DOKU_PAYMENT_DUE_MINUTES * 60 * 1000)
  const rows = await db.query.payment.findMany({
    where: and(
      isNotNull(payment.participantId),
      eq(payment.status, 'pending'),
      lt(payment.createdAt, cutoff),
    ),
    orderBy: [asc(payment.createdAt)],
    limit: 50,
  })

  let updated = 0
  for (const row of rows) {
    if (!isPaymentPastDue(row)) continue
    try {
      const resolved = await resolvePastDueStatus(row)
      await applyPaymentEvent(row.provider, {
        transactionId: row.transactionId,
        status: resolved.status,
        method: resolved.method,
      })
      updated += 1
    } catch (error) {
      console.error(
        'event payment status check failed',
        row.transactionId,
        error,
      )
    }
  }

  const stuck = await db.query.eventParticipant.findMany({
    where: and(
      eq(eventParticipant.status, 'pending_payment'),
      lt(eventParticipant.updatedAt, cutoff),
    ),
    orderBy: [asc(eventParticipant.updatedAt)],
    limit: 50,
  })

  let cancelled = 0
  let confirmed = 0
  for (const participant of stuck) {
    const payments = await db.query.payment.findMany({
      where: eq(payment.participantId, participant.id),
      orderBy: [asc(payment.createdAt)],
    })

    if (payments.some((row) => row.status === 'paid')) {
      await db
        .update(eventParticipant)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(eventParticipant.id, participant.id))
      confirmed += 1
      continue
    }

    const livePending = payments.some(
      (row) => row.status === 'pending' && !isPaymentPastDue(row),
    )
    if (livePending) continue

    const overduePending = payments.filter(
      (row) => row.status === 'pending' && isPaymentPastDue(row),
    )
    for (const row of overduePending) {
      try {
        const resolved = await resolvePastDueStatus(row)
        await applyPaymentEvent(row.provider, {
          transactionId: row.transactionId,
          status: resolved.status,
          method: resolved.method,
        })
        if (resolved.status === 'paid') {
          confirmed += 1
        } else {
          cancelled += 1
        }
        updated += 1
      } catch (error) {
        console.error(
          'event payment status check failed',
          row.transactionId,
          error,
        )
      }
    }

    if (overduePending.length > 0) continue

    // No usable payment left — cancel the unpaid registration.
    const newest = payments.at(-1)
    if (
      newest &&
      paymentCreatedAt(newest) >
        Date.now() - DOKU_PAYMENT_DUE_MINUTES * 60 * 1000
    ) {
      continue
    }

    await db
      .update(eventParticipant)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(eventParticipant.id, participant.id))
    cancelled += 1
  }

  return {
    skipped: false as const,
    checked: rows.length,
    updated,
    reconciled: stuck.length,
    confirmed,
    cancelled,
  }
}

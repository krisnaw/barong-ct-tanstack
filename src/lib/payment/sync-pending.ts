import { and, asc, eq, lt } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { db } from '~/lib/db'
import { payment } from '~/lib/order-schema'
import { applyPaymentEvent } from '~/lib/payment/apply-event'
import {
  checkDokuPaymentStatus,
  DOKU_PAYMENT_DUE_MINUTES,
} from '~/lib/payment/providers/doku'

function dokuConfigured() {
  return Boolean(env.DOKU_API_URL && env.DOKU_CLIENT_ID && env.DOKU_SECRET_KEY)
}

export async function syncPendingPayments() {
  if (!dokuConfigured()) {
    return { checked: 0, updated: 0 }
  }

  const cutoff = new Date(Date.now() - DOKU_PAYMENT_DUE_MINUTES * 60 * 1000)
  const rows = await db.query.payment.findMany({
    where: and(
      eq(payment.provider, 'doku'),
      eq(payment.status, 'pending'),
      lt(payment.createdAt, cutoff),
    ),
    orderBy: [asc(payment.createdAt)],
    limit: 50,
  })

  let updated = 0
  for (const row of rows) {
    try {
      const event = await checkDokuPaymentStatus(row.transactionId)
      const status = event?.status === 'paid' ? 'paid' : 'expired'
      await applyPaymentEvent('doku', {
        transactionId: row.transactionId,
        status,
        method: event?.method,
        payload: event?.payload ?? { source: 'cron' },
      })
      updated += 1
    } catch (error) {
      console.error('payment status check failed', row.transactionId, error)
    }
  }

  return { checked: rows.length, updated }
}

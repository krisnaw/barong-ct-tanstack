import handler from '@tanstack/react-start/server-entry'
import {
  syncPendingPayments,
  syncUnpaidEventPayments,
} from '~/lib/payment/sync-pending'

export default {
  fetch: handler.fetch,
  async scheduled() {
    const [shop, events] = await Promise.all([
      syncPendingPayments(),
      syncUnpaidEventPayments(),
    ])
    console.log('payment status sync', { shop, events })
  },
}

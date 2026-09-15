import handler from '@tanstack/react-start/server-entry'
import { syncPendingPayments } from '~/lib/payment/sync-pending'

export default {
  fetch: handler.fetch,
  async scheduled() {
    const result = await syncPendingPayments()
    console.log('payment status sync', result)
  },
}

import { createFileRoute } from '@tanstack/react-router'
import { applyPaymentEvent } from '~/lib/payment/apply-event'
import { getProviderByName } from '~/lib/payment/get-provider'

export const Route = createFileRoute('/api/payments/webhook/$provider')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let provider
        try {
          provider = getProviderByName(params.provider)
        } catch {
          return new Response('Unknown provider', { status: 404 })
        }

        const event = await provider.parseWebhook(request)
        if (!event) {
          return new Response('Invalid webhook', { status: 400 })
        }

        const applied = await applyPaymentEvent(provider.name, event)
        if (!applied) {
          return new Response('Payment not found', { status: 404 })
        }

        return new Response('ok', { status: 200 })
      },
    },
  },
})

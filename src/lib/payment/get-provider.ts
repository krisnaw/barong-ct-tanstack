import { env } from 'cloudflare:workers'
import { dokuProvider } from '~/lib/payment/providers/doku'
import { stubProvider } from '~/lib/payment/providers/stub'
import type { PaymentProvider, PaymentProviderName } from '~/lib/payment/types'

const providers: Record<PaymentProviderName, PaymentProvider> = {
  stub: stubProvider,
  doku: dokuProvider,
}

export function getProviderName(): PaymentProviderName {
  const value = (env.PAYMENT_PROVIDER ?? 'stub').toLowerCase()
  if (value === 'stub' || value === 'doku') return value
  throw new Error(
    `Unknown PAYMENT_PROVIDER "${env.PAYMENT_PROVIDER}". Use stub or doku.`,
  )
}

export function getProvider() {
  return providers[getProviderName()]
}

export function getProviderByName(name: string) {
  const value = name.toLowerCase()
  if (value === 'stub' || value === 'doku') return providers[value]
  throw new Error(`Unknown payment provider "${name}"`)
}

export function getPaymentDisplay() {
  const provider = getProvider()
  return {
    name: provider.name,
    displayName: provider.displayName,
    methods: provider.methods,
  }
}

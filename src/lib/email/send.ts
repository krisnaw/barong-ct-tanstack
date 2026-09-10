import { env } from 'cloudflare:workers'
import { autosendProvider } from '~/lib/email/providers/autosend'
import { cloudflareProvider } from '~/lib/email/providers/cloudflare'
import { resendProvider } from '~/lib/email/providers/resend'
import type {
  EmailMessage,
  EmailProvider,
  EmailProviderName,
} from '~/lib/email/types'

const providers: Record<EmailProviderName, EmailProvider> = {
  cloudflare: cloudflareProvider,
  resend: resendProvider,
  autosend: autosendProvider,
}

function getProviderName(): EmailProviderName {
  const value = (env.EMAIL_PROVIDER ?? 'resend').toLowerCase()
  if (value === 'cloudflare' || value === 'resend' || value === 'autosend') {
    return value
  }
  throw new Error(
    `Unknown EMAIL_PROVIDER "${env.EMAIL_PROVIDER}". Use cloudflare, resend, or autosend.`,
  )
}

function getDefaultFrom() {
  return {
    email: env.EMAIL_FROM || 'noreply@barongcycling.com',
    name: env.EMAIL_FROM_NAME || 'Barong Cycling Team',
  }
}

export async function sendEmail(message: EmailMessage) {
  const provider = providers[getProviderName()]
  await provider.send({
    ...message,
    from: message.from ?? getDefaultFrom(),
  })
}

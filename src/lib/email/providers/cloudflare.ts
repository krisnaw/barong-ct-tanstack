import { env } from 'cloudflare:workers'
import type { EmailProvider } from '~/lib/email/types'

function formatAddress(
  value: string | { email: string; name?: string },
): string | { email: string; name: string } {
  if (typeof value === 'string') return value
  return value.name
    ? { email: value.email, name: value.name }
    : value.email
}

export const cloudflareProvider: EmailProvider = {
  async send(message) {
    await env.EMAIL.send({
      to: formatAddress(message.to),
      from: {
        email: message.from.email,
        name: message.from.name ?? 'Barong Cycling Team',
      },
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo
        ? { replyTo: formatAddress(message.replyTo) }
        : {}),
    })
  },
}

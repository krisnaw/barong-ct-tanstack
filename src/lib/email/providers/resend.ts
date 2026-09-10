import { env } from 'cloudflare:workers'
import type { EmailAddress, EmailProvider } from '~/lib/email/types'

function formatFrom(from: EmailAddress) {
  return from.name ? `${from.name} <${from.email}>` : from.email
}

function formatTo(to: string | EmailAddress) {
  return typeof to === 'string' ? to : to.email
}

export const resendProvider: EmailProvider = {
  async send(message) {
    const apiKey = env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'barong-ct',
      },
      body: JSON.stringify({
        from: formatFrom(message.from),
        to: [formatTo(message.to)],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo
          ? {
              reply_to:
                typeof message.replyTo === 'string'
                  ? message.replyTo
                  : message.replyTo.email,
            }
          : {}),
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Resend error ${response.status}: ${body}`)
    }
  },
}

import { env } from 'cloudflare:workers'
import type { EmailAddress, EmailProvider } from '~/lib/email/types'

function toAutosendAddress(value: string | EmailAddress) {
  if (typeof value === 'string') return { email: value }
  return value.name
    ? { email: value.email, name: value.name }
    : { email: value.email }
}

export const autosendProvider: EmailProvider = {
  async send(message) {
    const apiKey = env.AUTOSEND_API_KEY
    if (!apiKey) {
      throw new Error('AUTOSEND_API_KEY is not set')
    }

    const response = await fetch('https://api.autosend.com/v1/mails/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toAutosendAddress(message.to),
        from: toAutosendAddress(message.from),
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo
          ? { replyTo: toAutosendAddress(message.replyTo) }
          : {}),
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`AutoSend error ${response.status}: ${body}`)
    }
  },
}

export type EmailAddress = {
  email: string
  name?: string
}

export type EmailMessage = {
  to: string | EmailAddress
  subject: string
  html: string
  text: string
  from?: EmailAddress
  replyTo?: string | EmailAddress
}

export type EmailProviderName = 'cloudflare' | 'resend' | 'autosend'

export type EmailProvider = {
  send(message: Required<Pick<EmailMessage, 'from'>> & EmailMessage): Promise<void>
}

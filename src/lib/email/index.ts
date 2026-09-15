export { sendEmail } from '~/lib/email/send'
export { sendMagicLinkEmail } from '~/lib/email/magic-link'
export { sendOrderShippedEmail } from '~/lib/email/order-shipped'
export { sendVerificationEmail } from '~/lib/email/verification'
export type {
  EmailAddress,
  EmailMessage,
  EmailProviderName,
} from '~/lib/email/types'

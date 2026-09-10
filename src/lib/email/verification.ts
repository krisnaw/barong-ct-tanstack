import { render } from '@react-email/render'
import { VerifyEmail } from '~/emails/verify-email'
import { sendEmail } from '~/lib/email/send'

export async function sendVerificationEmail({
  to,
  name,
  url,
}: {
  to: string
  name: string
  url: string
}) {
  const element = VerifyEmail({ name, url })
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  await sendEmail({
    to,
    subject: 'Verify your Barong CT email',
    html,
    text,
  })
}

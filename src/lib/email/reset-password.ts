import { render } from '@react-email/render'
import { ResetPasswordEmail } from '~/emails/reset-password'
import { emailLogoUrl } from '~/lib/email/public-url'
import { sendEmail } from '~/lib/email/send'

export async function sendResetPasswordEmail({
  to,
  name,
  url,
}: {
  to: string
  name: string
  url: string
}) {
  const element = ResetPasswordEmail({
    companyName: 'Barong',
    logoUrl: emailLogoUrl(),
    name,
    url,
  })
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  await sendEmail({
    to,
    subject: 'Reset your Barong CT password',
    html,
    text,
  })
}

import { render } from '@react-email/render'
import { MagicLinkEmail } from '~/emails/magic-link'
import { emailLogoUrl } from '~/lib/email/public-url'
import { sendEmail } from '~/lib/email/send'

export async function sendMagicLinkEmail({
  to,
  name,
  url,
}: {
  to: string
  name: string
  url: string
}) {
  const element = MagicLinkEmail({
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
    subject: 'Your Barong CT sign-in link',
    html,
    text,
  })
}

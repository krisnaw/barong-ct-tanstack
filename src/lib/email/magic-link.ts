import { render } from '@react-email/render'
import { env } from 'cloudflare:workers'
import { MagicLinkEmail } from '~/emails/magic-link'
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
  const baseUrl = (env.BETTER_AUTH_URL || 'https://barongcycling.com').replace(
    /\/$/,
    '',
  )
  const element = MagicLinkEmail({
    companyName: 'Barong',
    logoUrl: `${baseUrl}/barong_logo.png`,
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

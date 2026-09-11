import { render } from '@react-email/render'
import { env } from 'cloudflare:workers'
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
  const baseUrl = (env.BETTER_AUTH_URL || 'https://barongcycling.com').replace(
    /\/$/,
    '',
  )
  const element = VerifyEmail({
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
    subject: 'Verify your Barong CT email',
    html,
    text,
  })
}

import { render } from '@react-email/render'
import { env } from 'cloudflare:workers'
import { ResetPasswordEmail } from '~/emails/reset-password'
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
  const baseUrl = (env.BETTER_AUTH_URL || 'https://barongcycling.com').replace(
    /\/$/,
    '',
  )
  const element = ResetPasswordEmail({
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
    subject: 'Reset your Barong CT password',
    html,
    text,
  })
}

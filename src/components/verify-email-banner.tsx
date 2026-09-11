import * as React from 'react'
import { authClient } from '~/lib/auth-client'
import { useTranslations } from '~/lib/i18n'

export function VerifyEmailBanner() {
  const t = useTranslations()
  const { data: session, isPending } = authClient.useSession()
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  )
  const [error, setError] = React.useState<string | null>(null)

  const user = session?.user
  if (isPending || !user || user.emailVerified) return null

  async function resend() {
    if (!user) return
    setStatus('sending')
    setError(null)

    const { error: sendError } = await authClient.sendVerificationEmail({
      email: user.email,
      callbackURL: '/account',
    })

    if (sendError) {
      setStatus('error')
      setError(sendError.message || t.verifyEmail.resendError)
      return
    }

    setStatus('sent')
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="flex flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>
          {t.verifyEmail.prompt}
          {status === 'sent' ? t.verifyEmail.sentSuffix : '.'}
        </p>
        <div className="flex items-center gap-3">
          {error ? <span className="text-destructive">{error}</span> : null}
          <button
            className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80 disabled:opacity-50"
            disabled={status === 'sending' || status === 'sent'}
            onClick={() => void resend()}
            type="button"
          >
            {status === 'sending'
              ? t.verifyEmail.sending
              : status === 'sent'
                ? t.verifyEmail.emailSent
                : t.verifyEmail.resend}
          </button>
        </div>
      </div>
    </div>
  )
}

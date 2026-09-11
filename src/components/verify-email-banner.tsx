import * as React from 'react'
import { authClient } from '~/lib/auth-client'

export function VerifyEmailBanner() {
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
      setError(sendError.message || 'Could not resend email.')
      return
    }

    setStatus('sent')
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="flex flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>
          Please verify your email
          {status === 'sent' ? ' — check your inbox.' : '.'}
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
              ? 'Sending…'
              : status === 'sent'
                ? 'Email sent'
                : 'Resend email'}
          </button>
        </div>
      </div>
    </div>
  )
}

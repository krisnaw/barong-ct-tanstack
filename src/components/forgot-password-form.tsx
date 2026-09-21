import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { cn } from 'cn'

import { AuthBrandLink } from '~/components/auth-brand-link'
import { Button } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { authClient } from '~/lib/auth-client'

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [email, setEmail] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/auth/reset-password',
    })

    setPending(false)

    if (authError) {
      setError(authError.message || 'Could not send a reset link.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <AuthBrandLink />
            <h1 className="text-xl font-bold">Check your email</h1>
            <FieldDescription>
              If an account exists for {email}, we sent a password reset link.
            </FieldDescription>
          </div>
          <Field>
            <Button render={<Link to="/auth/login" />} variant="outline">
              Back to login
            </Button>
          </Field>
        </FieldGroup>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <AuthBrandLink />
            <h1 className="text-xl font-bold">Forgot your password?</h1>
            <FieldDescription>
              Enter your email and we&apos;ll send a reset link.
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              autoFocus
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="rider@barong.ct"
              required
              type="email"
              value={email}
            />
          </Field>
          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
          <Field>
            <Button disabled={pending} type="submit">
              {pending ? (<><Spinner /> Please wait…</>) : 'Send reset link'}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            Remembered it?{' '}
            <Link className="underline" to="/auth/login">
              Sign in
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  )
}

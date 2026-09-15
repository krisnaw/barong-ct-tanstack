import { Link, useNavigate } from '@tanstack/react-router'
import { RowsIcon } from '@phosphor-icons/react'
import * as React from 'react'
import { cn } from 'cn'

import { Button } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { authClient } from '~/lib/auth-client'

function magicLinkErrorMessage(code?: string) {
  if (!code) return null
  if (code === 'INVALID_TOKEN') {
    return 'This sign-in link is invalid or has expired. Request a new one.'
  }
  return 'Could not sign in with that link. Please try again.'
}

export function LoginForm({
  className,
  redirectTo,
  linkError,
  ...props
}: React.ComponentProps<'div'> & { redirectTo?: string; linkError?: string }) {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(
    () => magicLinkErrorMessage(linkError),
  )
  const [pending, setPending] = React.useState<'password' | 'magic' | null>(
    null,
  )
  const [magicLinkSent, setMagicLinkSent] = React.useState(false)

  const callbackURL = redirectTo?.startsWith('/') ? redirectTo : '/account'

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending('password')

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    })

    setPending(null)

    if (authError) {
      setError(authError.message || 'Could not sign in.')
      return
    }

    if (redirectTo?.startsWith('/')) {
      window.location.assign(redirectTo)
      return
    }
    void navigate({ to: '/account' })
  }

  async function onMagicLink() {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email to receive a sign-in link.')
      return
    }

    setPending('magic')
    const { error: authError } = await authClient.signIn.magicLink({
      email,
      callbackURL,
      errorCallbackURL: '/auth/login',
      metadata: { name: email.split('@')[0] || 'Rider' },
    })
    setPending(null)

    if (authError) {
      setError(authError.message || 'Could not send a sign-in link.')
      return
    }

    setMagicLinkSent(true)
  }

  if (magicLinkSent) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              to="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <RowsIcon className="size-6" />
              </div>
              <span className="sr-only">Barong Cycling Team</span>
            </Link>
            <h1 className="text-xl font-bold">Check your email</h1>
            <FieldDescription>
              We sent a sign-in link to {email}. It expires in 15 minutes.
            </FieldDescription>
          </div>
          <Field>
            <Button
              onClick={() => {
                setMagicLinkSent(false)
                setPassword('')
              }}
              type="button"
              variant="outline"
            >
              Use a different email
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
            <Link
              to="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <RowsIcon className="size-6" />
              </div>
              <span className="sr-only">Barong Cycling Team</span>
            </Link>
            <h1 className="text-xl font-bold">Welcome to Barong CT</h1>
            <FieldDescription>
              Don&apos;t have an account?{' '}
              <Link className="underline" to="/auth/signup">
                Sign up
              </Link>
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
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </Field>
          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
          <Field>
            <Button disabled={pending !== null} type="submit">
              {pending === 'password' ? 'Please wait…' : 'Login'}
            </Button>
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <Button
              disabled={pending !== null}
              onClick={() => void onMagicLink()}
              type="button"
              variant="outline"
            >
              {pending === 'magic' ? 'Please wait…' : 'Email me a sign-in link'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}

import { Link, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { cn } from 'cn'

import { AuthBrandLink } from '~/components/auth-brand-link'
import { Button } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { authClient, PASSWORD_AUTH_ENABLED } from '~/lib/auth-client'

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState<'password' | 'magic' | null>(
    null,
  )
  const [magicLinkSent, setMagicLinkSent] = React.useState(false)

  const displayName = name.trim() || email.split('@')[0] || 'Rider'

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!PASSWORD_AUTH_ENABLED) {
      await onMagicLink()
      return
    }

    setError(null)
    setPending('password')

    const { error: authError } = await authClient.signUp.email({
      name: displayName,
      email,
      password,
    })

    setPending(null)

    if (authError) {
      setError(authError.message || 'Could not create account.')
      return
    }

    void navigate({ to: '/account' })
  }

  async function onMagicLink() {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email to receive a sign-up link.')
      return
    }

    setPending('magic')
    const { error: authError } = await authClient.signIn.magicLink({
      email,
      name: displayName,
      callbackURL: '/account',
      newUserCallbackURL: '/account',
      errorCallbackURL: '/auth/login',
      metadata: { name: displayName },
    })
    setPending(null)

    if (authError) {
      setError(authError.message || 'Could not send a sign-up link.')
      return
    }

    setMagicLinkSent(true)
  }

  if (magicLinkSent) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <AuthBrandLink />
            <h1 className="text-xl font-bold">Check your email</h1>
            <FieldDescription>
              We sent a sign-up link to {email}. It expires in 15 minutes.
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
            <AuthBrandLink />
            <h1 className="text-xl font-bold">Create your account</h1>
            <FieldDescription>
              Already have an account?{' '}
              <Link className="underline" to="/auth/login">
                Sign in
              </Link>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              autoFocus
              id="name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Rider name"
              value={name}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="rider@barong.ct"
              required
              type="email"
              value={email}
            />
          </Field>
          {PASSWORD_AUTH_ENABLED ? (
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
          ) : null}
          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
          {PASSWORD_AUTH_ENABLED ? (
            <>
              <Field>
                <Button disabled={pending !== null} type="submit">
                  {pending === 'password' ? (<><Spinner /> Please wait…</>) : 'Create account'}
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
                  {pending === 'magic'
                    ? (<><Spinner /> Please wait…</>)
                    : 'Email me a sign-up link'}
                </Button>
              </Field>
            </>
          ) : (
            <Field>
              <Button disabled={pending !== null} type="submit">
                {pending === 'magic' ? (<><Spinner /> Please wait…</>) : 'Email me a sign-up link'}
              </Button>
            </Field>
          )}
        </FieldGroup>
      </form>
      {/* <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription> */}
    </div>
  )
}

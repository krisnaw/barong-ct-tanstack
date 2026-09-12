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
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { authClient } from '~/lib/auth-client'

export function LoginForm({
  className,
  redirectTo,
  ...props
}: React.ComponentProps<'div'> & { redirectTo?: string }) {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    })

    setPending(false)

    if (authError) {
      setError(authError.message || 'Could not sign in.')
      return
    }

    if (redirectTo === '/shop/checkout') {
      void navigate({ to: '/shop/checkout' })
    } else {
      void navigate({ to: '/account' })
    }
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
            <Button disabled={pending} type="submit">
              {pending ? 'Please wait…' : 'Login'}
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

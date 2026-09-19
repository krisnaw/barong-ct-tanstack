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
import { Spinner } from '~/components/ui/spinner'
import { authClient } from '~/lib/auth-client'

function resetTokenErrorMessage(code?: string) {
  if (!code) return null
  if (code === 'INVALID_TOKEN') {
    return 'This reset link is invalid or has expired. Request a new one.'
  }
  return 'Could not reset your password with that link. Please try again.'
}

export function ResetPasswordForm({
  className,
  token,
  linkError,
  ...props
}: React.ComponentProps<'div'> & { token?: string; linkError?: string }) {
  const navigate = useNavigate()
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(
    () => resetTokenErrorMessage(linkError),
  )
  const [pending, setPending] = React.useState(false)

  const hasToken = Boolean(token)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('This reset link is invalid or has expired. Request a new one.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    const { error: authError } = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setPending(false)

    if (authError) {
      setError(authError.message || 'Could not reset your password.')
      return
    }

    void navigate({ to: '/auth/login' })
  }

  if (!hasToken) {
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
            <h1 className="text-xl font-bold">Reset link expired</h1>
            <FieldDescription>
              {error ||
                'This reset link is invalid or has expired. Request a new one.'}
            </FieldDescription>
          </div>
          <Field>
            <Button
              render={<Link to="/auth/forgot-password" />}
              variant="outline"
            >
              Request a new link
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
            <h1 className="text-xl font-bold">Choose a new password</h1>
            <FieldDescription>
              Enter a new password for your Barong CT account.
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <Input
              autoFocus
              id="password"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input
              id="confirmPassword"
              minLength={8}
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </Field>
          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
          <Field>
            <Button disabled={pending} type="submit">
              {pending ? (<><Spinner /> Please wait…</>) : 'Update password'}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            <Link className="underline" to="/auth/login">
              Back to login
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  )
}

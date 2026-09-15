import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignUpForm } from '~/components/signup-form'
import { PASSWORD_AUTH_ENABLED } from '~/lib/auth-client'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/auth/signup')({
  beforeLoad: () => {
    if (!PASSWORD_AUTH_ENABLED) {
      throw redirect({ to: '/auth/login' })
    }
  },
  head: () => ({
    meta: seo({
      title: 'Sign up | Barong Cycling Team',
      description: 'Create a Barong Cycling Team account.',
    }),
  }),
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  )
}

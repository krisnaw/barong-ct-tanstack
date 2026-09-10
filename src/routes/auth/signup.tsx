import { createFileRoute } from '@tanstack/react-router'
import { SignUpForm } from '~/components/signup-form'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/auth/signup')({
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

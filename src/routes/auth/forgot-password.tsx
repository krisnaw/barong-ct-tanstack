import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordForm } from '~/components/forgot-password-form'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/auth/forgot-password')({
  head: () => ({
    meta: seo({
      title: 'Forgot password | Barong Cycling Team',
      description: 'Reset your Barong Cycling Team account password.',
    }),
  }),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}

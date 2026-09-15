import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordForm } from '~/components/reset-password-form'
import { seo } from '~/utils/seo'

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
})

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: resetPasswordSearchSchema,
  head: () => ({
    meta: seo({
      title: 'Reset password | Barong Cycling Team',
      description: 'Choose a new Barong Cycling Team account password.',
    }),
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token, error } = Route.useSearch()
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ResetPasswordForm linkError={error} token={token} />
      </div>
    </div>
  )
}

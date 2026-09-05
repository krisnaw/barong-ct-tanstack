import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '~/components/login-form'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/auth/login')({
  head: () => ({
    meta: seo({
      title: 'Login | Barong Cycling Team',
      description: 'Sign in to the Barong Cycling Team dashboard.',
    }),
  }),
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}

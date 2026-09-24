import { Link, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/finance/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/finance/income' })
  },
  component: FinanceIndexRedirect,
})

function FinanceIndexRedirect() {
  return (
    <p className="p-4 text-sm text-muted-foreground">
      Redirecting to{' '}
      <Link className="underline" to="/dashboard/finance/income">
        Income
      </Link>
      …
    </p>
  )
}

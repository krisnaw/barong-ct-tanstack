import { Link, redirect, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/events' })
  },
  component: DashboardIndexRedirect,
})

function DashboardIndexRedirect() {
  return (
    <p className="p-4 text-sm text-muted-foreground">
      Redirecting to{' '}
      <Link className="underline" to="/dashboard/events">
        Events
      </Link>
      …
    </p>
  )
}

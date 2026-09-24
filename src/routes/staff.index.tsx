import { Link, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/staff/')({
  beforeLoad: () => {
    throw redirect({ to: '/staff/pickup' })
  },
  component: StaffIndexRedirect,
})

function StaffIndexRedirect() {
  return (
    <p className="text-sm text-muted-foreground">
      Redirecting to{' '}
      <Link className="underline" to="/staff/pickup">
        Pickup
      </Link>
      …
    </p>
  )
}

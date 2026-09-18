import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/events/$slug')({
  component: DashboardEventSlugLayout,
})

function DashboardEventSlugLayout() {
  return <Outlet />
}

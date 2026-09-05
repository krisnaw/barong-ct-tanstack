import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/events')({
  head: () => ({
    meta: seo({
      title: 'Events · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team events.',
    }),
  }),
  component: DashboardEventsLayout,
})

function DashboardEventsLayout() {
  return <Outlet />
}

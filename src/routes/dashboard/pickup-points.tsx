import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/pickup-points')({
  head: () => ({
    meta: seo({
      title: 'Pickup Points · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team shop pickup points.',
    }),
  }),
  component: DashboardPickupPointsLayout,
})

function DashboardPickupPointsLayout() {
  return <Outlet />
}

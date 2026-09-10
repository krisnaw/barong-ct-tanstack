import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/orders')({
  head: () => ({
    meta: seo({
      title: 'Orders · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team shop orders.',
    }),
  }),
  component: DashboardOrdersLayout,
})

function DashboardOrdersLayout() {
  return <Outlet />
}

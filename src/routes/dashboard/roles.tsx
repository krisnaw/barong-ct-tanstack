import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/roles')({
  head: () => ({
    meta: seo({
      title: 'Roles · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team admin and staff roles.',
    }),
  }),
  component: DashboardRolesLayout,
})

function DashboardRolesLayout() {
  return <Outlet />
}

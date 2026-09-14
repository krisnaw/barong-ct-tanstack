import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/users')({
  head: () => ({
    meta: seo({
      title: 'Users · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team users.',
    }),
  }),
  component: DashboardUsersLayout,
})

function DashboardUsersLayout() {
  return <Outlet />
}

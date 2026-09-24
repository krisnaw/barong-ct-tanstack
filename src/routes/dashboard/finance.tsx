import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/finance')({
  head: () => ({
    meta: seo({
      title: 'Finance · Dashboard | Barong Cycling Team',
      description: 'Simple accounting for Barong Cycling Team.',
    }),
  }),
  component: DashboardFinanceLayout,
})

function DashboardFinanceLayout() {
  return <Outlet />
}

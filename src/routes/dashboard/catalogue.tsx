import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/catalogue')({
  head: () => ({
    meta: seo({
      title: 'Catalogue · Dashboard | Barong Cycling Team',
      description: 'Manage the Barong Cycling Team shop catalogue.',
    }),
  }),
  component: DashboardCatalogueLayout,
})

function DashboardCatalogueLayout() {
  return <Outlet />
}

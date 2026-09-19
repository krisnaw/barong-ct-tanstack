import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getSession } from '~/lib/auth.functions'
import { listProducts } from '~/lib/shop.functions'
import { ShopCatalogSkeleton } from '~/components/page-skeletons'

export const Route = createFileRoute('/shop')({
  pendingComponent: ShopCatalogSkeleton,
  pendingMs: 150,
  loader: async () => {
    await getSession()
    return listProducts({ data: { activeOnly: true } })
  },
  component: ShopLayout,
})

function ShopLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}

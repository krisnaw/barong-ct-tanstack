import { Outlet, createFileRoute } from '@tanstack/react-router'
import { listProducts } from '~/lib/shop.functions'

export const Route = createFileRoute('/shop')({
  loader: () => listProducts({ data: { activeOnly: true } }),
  component: ShopLayout,
})

function ShopLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}

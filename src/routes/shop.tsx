import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getSession } from '~/lib/auth.functions'
import { listProducts } from '~/lib/shop.functions'

export const Route = createFileRoute('/shop')({
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

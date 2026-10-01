import { createFileRoute } from '@tanstack/react-router'
import { ShopCatalog } from '~/components/shop-catalog'
import { seo } from '~/utils/seo'
import { Route as ShopRoute } from './shop'

export const Route = createFileRoute('/shop/')({
  head: () => ({
    meta: seo({
      title: 'Cycling Jerseys & Club Kit | Barong Cycling Team',
      description:
        "Official Barong Cycling Team jerseys, including Classic Black, Melali White and the climb-season kits. Ride in the Denpasar peloton's colours.",
    }),
  }),
  component: ShopPage,
})

function ShopPage() {
  const products = ShopRoute.useLoaderData()
  return <ShopCatalog products={products} />
}

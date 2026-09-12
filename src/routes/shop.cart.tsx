import { createFileRoute } from '@tanstack/react-router'
import { ShopCart } from '~/components/shop-cart'
import { seo } from '~/utils/seo'
import { Route as ShopRoute } from './shop'

export const Route = createFileRoute('/shop/cart')({
  head: () => ({
    meta: seo({
      title: 'Bag | Barong Cycling Team',
      description: 'Your Barong kit bag — jerseys ready for pickup.',
    }),
  }),
  component: ShopCartPage,
})

function ShopCartPage() {
  const products = ShopRoute.useLoaderData()
  return <ShopCart products={products} />
}

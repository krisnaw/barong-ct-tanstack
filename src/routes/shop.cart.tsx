import { createFileRoute } from '@tanstack/react-router'
import { ShopCart } from '~/components/shop-cart'
import { seo } from '~/utils/seo'

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
  return <ShopCart />
}

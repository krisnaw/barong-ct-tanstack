import { createFileRoute } from '@tanstack/react-router'
import { ShopCatalog } from '~/components/shop-catalog'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/shop/')({
  head: () => ({
    meta: seo({
      title: 'Shop | Barong Cycling Team',
      description:
        'Club jerseys for the Denpasar peloton — Classic Black, Melali White, and the climb-season kits.',
    }),
  }),
  component: ShopPage,
})

function ShopPage() {
  return <ShopCatalog />
}

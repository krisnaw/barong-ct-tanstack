import { createFileRoute, notFound } from '@tanstack/react-router'
import { ShopProductDetail } from '~/components/shop-product'
import { getShopProduct } from '~/data/shop'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/shop/$slug')({
  loader: ({ params }) => {
    const product = getShopProduct(params.slug)
    if (!product) {
      throw notFound()
    }
    return product
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.name} | Barong Cycling Team`,
          description: loaderData.description,
          image: `${loaderData.image}&w=1200&q=80`,
        })
      : undefined,
  }),
  component: ShopProductPage,
})

function ShopProductPage() {
  const product = Route.useLoaderData()
  return <ShopProductDetail product={product} />
}

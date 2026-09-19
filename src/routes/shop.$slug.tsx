import { createFileRoute, notFound } from '@tanstack/react-router'
import { ShopProductDetail } from '~/components/shop-product'
import { getProductBySlug } from '~/lib/shop.functions'
import { seo } from '~/utils/seo'
import { ShopProductSkeleton } from '~/components/page-skeletons'

export const Route = createFileRoute('/shop/$slug')({
  pendingComponent: ShopProductSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } })
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

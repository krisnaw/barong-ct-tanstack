import { createFileRoute, notFound } from '@tanstack/react-router'
import { AccountOrderDetailPanel } from '~/components/account-page'
import { getOrderById } from '~/lib/order.functions'
import { seo } from '~/utils/seo'
import { PublicPageSkeleton } from '~/components/page-skeletons'

export const Route = createFileRoute('/account/orders/$id')({
  pendingComponent: PublicPageSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const order = await getOrderById({ data: { id: params.id } })
    if (!order) {
      throw notFound()
    }
    return { order }
  },
  head: ({ loaderData, params }) => ({
    meta: seo({
      title: `${loaderData?.order.id ?? params.id} | Account | Barong Cycling Team`,
      description: 'Your Barong kit order details.',
    }),
  }),
  component: AccountOrderDetailPage,
})

function AccountOrderDetailPage() {
  const { order } = Route.useLoaderData()
  return <AccountOrderDetailPanel order={order} />
}

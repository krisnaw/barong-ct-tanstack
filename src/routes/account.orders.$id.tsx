import { createFileRoute, notFound } from '@tanstack/react-router'
import { AccountOrderDetailPanel } from '~/components/account-page'
import { getOrderById } from '~/lib/order.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/orders/$id')({
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

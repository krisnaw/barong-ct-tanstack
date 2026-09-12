import { createFileRoute } from '@tanstack/react-router'
import { AccountOrdersPanel } from '~/components/account-page'
import { listMyOrders } from '~/lib/order.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/orders/')({
  loader: async () => (await listMyOrders()) ?? [],
  head: () => ({
    meta: seo({
      title: 'Orders | Account | Barong Cycling Team',
      description: 'Your Barong kit order history.',
    }),
  }),
  component: AccountOrdersPage,
})

function AccountOrdersPage() {
  const orders = Route.useLoaderData() ?? []
  return <AccountOrdersPanel orders={orders} />
}

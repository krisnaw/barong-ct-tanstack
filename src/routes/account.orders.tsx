import { createFileRoute } from '@tanstack/react-router'
import { AccountOrdersPanel } from '~/components/account-page'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/orders')({
  head: () => ({
    meta: seo({
      title: 'Orders | Account | Barong Cycling Team',
      description: 'Your Barong kit order history.',
    }),
  }),
  component: AccountOrdersPage,
})

function AccountOrdersPage() {
  return <AccountOrdersPanel />
}

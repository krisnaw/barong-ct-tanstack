import { Outlet, createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/orders')({
  head: () => ({
    meta: seo({
      title: 'Orders | Account | Barong Cycling Team',
      description: 'Your Barong kit order history.',
    }),
  }),
  component: AccountOrdersLayout,
})

function AccountOrdersLayout() {
  return <Outlet />
}

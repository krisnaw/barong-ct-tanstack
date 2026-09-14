import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '~/lib/auth.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/shop/checkout')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: '/auth/login',
        search: { redirect: location.href },
      })
    }
  },
  head: () => ({
    meta: seo({
      title: 'Checkout | Barong Cycling Team',
      description: 'Complete your Barong kit order — collect at a pickup point.',
    }),
  }),
  component: ShopCheckoutLayout,
})

function ShopCheckoutLayout() {
  return <Outlet />
}

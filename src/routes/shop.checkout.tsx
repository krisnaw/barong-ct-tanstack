import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '~/lib/auth.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/shop/checkout')({
  beforeLoad: async ({ location }) => {
    // Return/cancel must stay reachable after DOKU redirects back.
    // Auth is enforced on the checkout form route and by order loaders.
    const path = location.pathname.replace(/\/$/, '') || '/'
    if (
      path.endsWith('/shop/checkout/return') ||
      path.endsWith('/shop/checkout/cancel') ||
      path.endsWith('/shop/checkout/simulate')
    ) {
      return
    }
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

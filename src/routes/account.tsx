import { createFileRoute, redirect } from '@tanstack/react-router'
import { AccountLayout } from '~/components/account-page'
import { getSession } from '~/lib/auth.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/auth/login' })
    }
  },
  head: () => ({
    meta: seo({
      title: 'Account | Barong Cycling Team',
      description:
        'Manage your Barong account — profile, kit size, delivery address, and orders.',
    }),
  }),
  component: AccountRoute,
})

function AccountRoute() {
  return (
    <main>
      <AccountLayout />
    </main>
  )
}

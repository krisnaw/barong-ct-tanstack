import { createFileRoute } from '@tanstack/react-router'
import { AccountLayout } from '~/components/account-page'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account')({
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

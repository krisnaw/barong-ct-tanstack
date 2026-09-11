import { createFileRoute } from '@tanstack/react-router'
import { AccountAddressPanel } from '~/components/account-page'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/address')({
  head: () => ({
    meta: seo({
      title: 'Shipping Address | Account | Barong Cycling Team',
      description: 'Save a shipping address for Barong kit orders.',
    }),
  }),
  component: AccountAddressPage,
})

function AccountAddressPage() {
  return <AccountAddressPanel />
}

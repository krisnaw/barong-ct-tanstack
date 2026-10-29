import { createFileRoute } from '@tanstack/react-router'
import { AccountAddressPanel } from '~/components/account/address-form'
import { getMyShippingAddresses } from '~/lib/shipping-address.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/address')({
  loader: async () => {
    const addresses = await getMyShippingAddresses()
    return addresses[0] ?? null
  },
  head: () => ({
    meta: seo({
      title: 'Shipping Address | Account | Barong Cycling Team',
      description: 'Save a shipping address for Barong kit orders.',
    }),
  }),
  component: AccountAddressPage,
})

function AccountAddressPage() {
  const address = Route.useLoaderData()
  return <AccountAddressPanel address={address} />
}

import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AccountAddressPanel } from '~/components/account/address-form'
import { toast } from '~/components/ui/toast'
import {
  getMyShippingAddresses,
  upsertMyShippingAddress,
} from '~/lib/shipping-address.functions'
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
  const router = useRouter()

  return (
    <AccountAddressPanel
      address={address}
      key={address ? JSON.stringify(address) : 'empty'}
      onSave={async (draft) => {
        await upsertMyShippingAddress({
          data: {
            id: draft.id || undefined,
            address: draft.address,
            apartment: draft.apartment,
            city: draft.city,
            province: draft.province,
            postal: draft.postal,
          },
        })
        toast.add({
          type: 'success',
          title: 'Shipping address saved',
        })
        await router.invalidate()
      }}
    />
  )
}

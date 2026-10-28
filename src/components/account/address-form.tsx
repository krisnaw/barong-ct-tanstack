import * as React from 'react'
import { AddressFields, SaveBar } from '~/components/account/fields'
import { toast } from '~/components/ui/toast'
import {
  emptyShippingAddress,
  useAccount,
  type AccountShippingAddress,
} from '~/lib/account'

export function AccountAddressPanel() {
  const { shippingAddress, updateShippingAddress } = useAccount()
  const [draft, setDraft] = React.useState<AccountShippingAddress>(
    () => shippingAddress ?? emptyShippingAddress(),
  )
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    setDraft(shippingAddress ?? emptyShippingAddress())
  }, [shippingAddress])

  function setField<K extends keyof AccountShippingAddress>(
    key: K,
    value: AccountShippingAddress[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await updateShippingAddress({
        id: draft.id,
        address: draft.address,
        apartment: draft.apartment,
        city: draft.city,
        province: draft.province,
        postal: draft.postal,
      })
      toast.add({
        type: 'success',
        title: 'Shipping address saved',
      })
    } catch {
      setError('Could not save shipping address')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Shipping address
      </h2>
      <AddressFields
        idPrefix="shipping"
        onChange={(key, value) => setField(key, value)}
        value={draft}
      />
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <SaveBar pending={pending} />
    </form>
  )
}

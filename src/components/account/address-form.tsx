import * as React from 'react'
import { AddressFields, SaveBar } from '~/components/account/fields'
import { toast } from '~/components/ui/toast'
import { upsertMyShippingAddress } from '~/lib/shipping-address.functions'
import type { AccountShippingAddress } from '~/lib/account'

function blankAddress(): AccountShippingAddress {
  return {
    id: '',
    label: 'Home',
    address: '',
    apartment: '',
    city: '',
    province: '',
    postal: '',
    isDefault: true,
  }
}

export function AccountAddressPanel({
  address,
}: {
  address: AccountShippingAddress | null
}) {
  const [draft, setDraft] = React.useState<AccountShippingAddress>(
    () => address ?? blankAddress(),
  )
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

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
      const saved = await upsertMyShippingAddress({
        data: {
          id: draft.id || undefined,
          address: draft.address,
          apartment: draft.apartment,
          city: draft.city,
          province: draft.province,
          postal: draft.postal,
        },
      })
      setDraft(saved)
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
        allowEmptyProvince
        idPrefix="shipping"
        onChange={(key, value) => setField(key, value)}
        value={draft}
      />
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <SaveBar pending={pending} />
    </form>
  )
}

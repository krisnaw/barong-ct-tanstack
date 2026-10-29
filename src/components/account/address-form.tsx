import * as React from 'react'
import { AddressFields, SaveBar } from '~/components/account/fields'
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
  onSave,
}: {
  address: AccountShippingAddress | null
  onSave: (draft: AccountShippingAddress) => Promise<void>
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
      await onSave(draft)
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

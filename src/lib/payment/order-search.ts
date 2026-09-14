function firstString(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (Array.isArray(value)) return firstString(value[0])
  return ''
}

export function checkoutOrderSearch(search: Record<string, unknown>) {
  const order =
    firstString(search.order) ||
    firstString(search.invoice_number) ||
    firstString(search.invoiceNumber)
  return { order }
}

export function orderLookupIds(id: string) {
  const trimmed = id.trim()
  const ids = [trimmed]
  const withoutInvoiceSuffix = trimmed.replace(/-[a-f0-9]{8}$/i, '')
  if (withoutInvoiceSuffix && withoutInvoiceSuffix !== trimmed) {
    ids.push(withoutInvoiceSuffix)
  }
  return ids
}

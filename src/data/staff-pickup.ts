import type { ShopOrder } from '~/data/orders'
import { orderCustomerName } from '~/data/orders'

export function matchesStaffPickupQuery(order: ShopOrder, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const phoneQ = q.replace(/\s/g, '')
  return (
    order.id.toLowerCase().includes(q) ||
    orderCustomerName(order).toLowerCase().includes(q) ||
    order.phone.replace(/\s/g, '').includes(phoneQ) ||
    order.email.toLowerCase().includes(q) ||
    order.lines.some(
      (line) =>
        line.name.toLowerCase().includes(q) ||
        line.color.toLowerCase().includes(q) ||
        line.size.toLowerCase().includes(q),
    )
  )
}

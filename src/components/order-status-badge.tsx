import { orderStatusLabel, orderStatusStyles, type OrderStatus } from '~/data/orders'
import { StatusBadge } from '~/components/status-badge'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <StatusBadge className={orderStatusStyles[status]}>
      {orderStatusLabel(status)}
    </StatusBadge>
  )
}

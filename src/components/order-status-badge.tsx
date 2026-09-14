import { orderStatusLabel, orderStatusStyles, type OrderStatus } from '~/data/orders'
import { cn } from '~/lib/utils'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
        orderStatusStyles[status],
      )}
    >
      {orderStatusLabel(status)}
    </span>
  )
}

import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import { OrderStatusBadge } from '~/components/order-status-badge'
import { formatOrderDate, orderItemCount, type ShopOrder } from '~/data/orders'
import { formatShopPrice, shopImageSrc } from '~/data/shop'
import { useAccount } from '~/lib/account'
import { AccountOrdersSkeleton } from '~/components/page-skeletons'
import { listMyOrders } from '~/lib/order.functions'
import { cn } from '~/lib/utils'

export function AccountOrdersPanel({
  orders: initialOrders,
}: {
  orders?: ShopOrder[]
}) {
  const { profile } = useAccount()
  const [orders, setOrders] = React.useState<ShopOrder[]>(initialOrders ?? [])
  const [ready, setReady] = React.useState(Array.isArray(initialOrders))

  React.useEffect(() => {
    if (Array.isArray(initialOrders)) {
      setOrders(initialOrders)
      setReady(true)
      return
    }
    let cancelled = false
    void listMyOrders()
      .then((rows) => {
        if (!cancelled) setOrders(rows ?? [])
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [initialOrders])

  if (!profile) return null

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Order history
      </h2>
      {!ready ? (
        <div className="mt-6">
          <AccountOrdersSkeleton showHeading={false} />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 border-y border-border py-10">
          <p className="font-heading text-base font-medium tracking-tight">
            No orders yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Jerseys you check out will land here.
          </p>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-5')}
            to="/shop"
          >
            Shop jerseys
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderRow({ order }: { order: ShopOrder }) {
  const count = orderItemCount(order)
  const preview = order.lines[0]
  return (
    <li>
      <Link
        className="flex items-center gap-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
        params={{ id: order.id }}
        to="/account/orders/$id"
      >
        {preview ? (
          <img
            alt=""
            className="size-14 shrink-0 object-cover bg-muted"
            height={112}
            src={shopImageSrc(preview.image, 112)}
            width={112}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{order.id}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatOrderDate(order.placedAt)}
            <span className="text-border"> · </span>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-sm font-medium tabular-nums">
            {formatShopPrice(order.total)}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
      </Link>
    </li>
  )
}

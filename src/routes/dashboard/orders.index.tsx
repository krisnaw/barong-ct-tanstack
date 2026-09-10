import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  formatOrderDate,
  orderCustomerName,
  orderItemCount,
  orderStatuses,
  type OrderStatus,
} from '~/data/orders'
import { formatShopPrice } from '~/data/shop'
import { useShopOrders } from '~/lib/orders'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  packed: 'border-sky-200 bg-sky-50 text-sky-800',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

export const Route = createFileRoute('/dashboard/orders/')({
  component: DashboardOrdersPage,
})

function DashboardOrdersPage() {
  const { orders } = useShopOrders()
  const [filter, setFilter] = React.useState<OrderStatus | 'all'>('all')
  const visible =
    filter === 'all' ? orders : orders.filter((order) => order.status === filter)
  const openCount = orders.filter(
    (order) =>
      order.status === 'pending' ||
      order.status === 'packed' ||
      order.status === 'shipped',
  ).length

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Orders</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} total · {openCount} in progress
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All
          </FilterButton>
          {orderStatuses.map((status) => (
            <FilterButton
              active={filter === status}
              key={status}
              onClick={() => setFilter(status)}
            >
              {status}
            </FilterButton>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No orders in this status.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {visible.map((order) => (
              <li key={order.id}>
                <Link
                  className="flex items-center gap-4 px-4 py-3 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
                  params={{ id: order.id }}
                  to="/dashboard/orders/$id"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {order.id}
                      <span className="text-border"> · </span>
                      {orderCustomerName(order)}
                    </p>
                    <p className="mt-0.5 truncate text-muted-foreground">
                      {formatOrderDate(order.placedAt)}
                      <span className="text-border"> · </span>
                      {orderItemCount(order)}{' '}
                      {orderItemCount(order) === 1 ? 'item' : 'items'}
                      <span className="text-border"> · </span>
                      {formatShopPrice(order.total)}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase sm:inline">
                    {order.payment}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
                      orderStatusStyles[order.status],
                    )}
                  >
                    {order.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'border px-3 py-1.5 text-sm font-medium capitalize transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border hover:border-foreground/40',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

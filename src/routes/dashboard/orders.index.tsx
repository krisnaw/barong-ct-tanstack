import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  formatOrderDate,
  orderCustomerName,
  orderItemCount,
  orderPaymentStatus,
  orderStatusLabel,
  orderStatuses,
  type OrderStatus,
} from '~/data/orders'
import { formatShopPrice } from '~/data/shop'
import { listOrders } from '~/lib/order.functions'
import { OrderStatusBadge } from '~/components/order-status-badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

export const Route = createFileRoute('/dashboard/orders/')({
  loader: async () => (await listOrders()) ?? [],
  component: DashboardOrdersPage,
})

function DashboardOrdersPage() {
  const orders = Route.useLoaderData()
  const statusFilterId = React.useId()
  const [filter, setFilter] = React.useState<OrderStatus | 'all'>('all')
  const visible =
    filter === 'all' ? orders : orders.filter((order) => order.status === filter)
  const openCount = orders.filter(
    (order) =>
      order.status === 'pending' ||
      order.status === 'paid' ||
      order.status === 'processing' ||
      order.status === 'shipped' ||
      order.status === 'delivered',
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Orders
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} total · {openCount} in progress
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={statusFilterId}>Status</Label>
            <select
              className="h-8 min-w-44 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id={statusFilterId}
              onChange={(event) =>
                setFilter(event.target.value as OrderStatus | 'all')
              }
              value={filter}
            >
              <option value="all">All</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No orders in this status.
          </p>
        ) : (
          <div className="border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Order</TableHead>
                  <TableHead className="px-4">Customer</TableHead>
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4 text-right">Items</TableHead>
                  <TableHead className="px-4 text-right">Total</TableHead>
                  <TableHead className="px-4">Payment</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((order) => {
                  const count = orderItemCount(order)
                  return (
                    <TableRow className="relative" key={order.id}>
                      <TableCell className="px-4 py-3 font-medium">
                        <Link
                          className="after:absolute after:inset-0"
                          params={{ id: order.id }}
                          to="/dashboard/orders/$id"
                        >
                          {order.id}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {orderCustomerName(order)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {formatOrderDate(order.placedAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {count}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {formatShopPrice(order.total)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {orderPaymentStatus(order)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}

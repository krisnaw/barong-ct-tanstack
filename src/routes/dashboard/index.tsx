import { Link, createFileRoute } from '@tanstack/react-router'
import {
  formatOrderDate,
  formatShopWeekLabel,
  orderCustomerName,
  orderItemCount,
  orderPlacedThisWeek,
} from '~/data/orders'
import { formatShopPrice } from '~/data/shop'
import { listOrders } from '~/lib/order.functions'
import { OrderStatusBadge } from '~/components/order-status-badge'
import { DashboardTableSkeleton } from '~/components/page-skeletons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { buttonVariants } from '~/components/ui/button'
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
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/')({
  pendingComponent: () => <DashboardTableSkeleton columns={7} />,
  pendingMs: 150,
  loader: async () => {
    const orders = (await listOrders()) ?? []
    return orders.filter((order) => orderPlacedThisWeek(order.placedAt))
  },
  head: () => ({
    meta: seo({
      title: 'Dashboard | Barong Cycling Team',
      description: 'Barong Cycling Team admin dashboard.',
    }),
  }),
  component: DashboardHomePage,
})

function DashboardHomePage() {
  const orders = Route.useLoaderData()
  const weekLabel = formatShopWeekLabel()

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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Shop orders this week
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} ·{' '}
              {weekLabel}
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            to="/dashboard/orders"
          >
            All orders
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="rounded-lg border border-border px-4 py-8 text-sm text-muted-foreground">
            No shop orders this week.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Order</TableHead>
                  <TableHead className="px-4">Customer</TableHead>
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4 text-right">Items</TableHead>
                  <TableHead className="px-4 text-right">Total</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const count = orderItemCount(order)
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="px-4 py-3 font-medium">
                        {order.id}
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
                      <TableCell className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex justify-end">
                          <Link
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                            )}
                            params={{ id: order.id }}
                            to="/dashboard/orders/$id"
                          >
                            Detail
                          </Link>
                        </div>
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

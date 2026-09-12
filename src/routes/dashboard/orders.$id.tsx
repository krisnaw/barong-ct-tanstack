import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import {
  formatOrderDate,
  orderCustomerName,
  orderItemCount,
  orderPaymentStatus,
  orderStatuses,
  type OrderPayment,
  type OrderStatus,
} from '~/data/orders'
import { formatCustomMeasurements, formatShopPrice, shopImageSrc } from '~/data/shop'
import {
  getOrderById,
  updateOrderPayment,
  updateOrderStatus,
} from '~/lib/order.functions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  packed: 'border-sky-200 bg-sky-50 text-sky-800',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

export const Route = createFileRoute('/dashboard/orders/$id')({
  loader: async ({ params }) => {
    const order = await getOrderById({ data: { id: params.id } })
    if (!order) {
      throw notFound()
    }
    return { order }
  },
  head: ({ loaderData, params }) => ({
    meta: seo({
      title: `${loaderData?.order.id ?? params.id} · Dashboard | Barong Cycling Team`,
      description: 'Manage a Barong Cycling Team shop order.',
    }),
  }),
  component: DashboardOrderDetailPage,
})

function DashboardOrderDetailPage() {
  const { order } = Route.useLoaderData()
  const router = useRouter()

  async function changeStatus(status: OrderStatus) {
    await updateOrderStatus({ data: { id: order.id, status } })
    await router.invalidate()
  }

  async function changePayment(payment: OrderPayment) {
    await updateOrderPayment({ data: { id: order.id, payment } })
    await router.invalidate()
  }

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/dashboard/orders" />}>
                  Orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{order.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
                  orderStatusStyles[order.status],
                )}
              >
                {order.status}
              </span>
              <span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                {orderPaymentStatus(order)}
              </span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              {order.id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orderCustomerName(order)}
              <span className="text-border"> · </span>
              {formatOrderDate(order.placedAt)}
              <span className="text-border"> · </span>
              {orderItemCount(order)}{' '}
              {orderItemCount(order) === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Fulfillment
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {orderStatuses.map((status) => (
                <button
                  className={cn(
                    'border px-3 py-2 text-sm font-medium capitalize transition-colors',
                    order.status === status
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/40',
                  )}
                  key={status}
                  onClick={() => void changeStatus(status)}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Payment
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['unpaid', 'paid'] as const).map((payment) => (
                <button
                  className={cn(
                    'border px-3 py-2 text-sm font-medium capitalize transition-colors',
                    (payment === 'paid'
                      ? orderPaymentStatus(order) === 'paid'
                      : orderPaymentStatus(order) !== 'paid')
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/40',
                  )}
                  key={payment}
                  onClick={() => void changePayment(payment)}
                  type="button"
                >
                  {payment}
                </button>
              ))}
            </div>
            {order.payment ? (
              <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
                <div>
                  Provider{' '}
                  <span className="text-foreground">{order.payment.provider}</span>
                </div>
                <div>
                  Transaction{' '}
                  <span className="break-all text-foreground">
                    {order.payment.transactionId}
                  </span>
                </div>
              </dl>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Items
          </h2>
          <ul className="mt-3 divide-y divide-border border border-border">
            {order.lines.map((item) => (
              <li
                className="flex items-center gap-4 px-4 py-3 text-sm"
                key={`${item.slug}-${item.size}-${item.custom?.chest ?? ''}`}
              >
                <img
                  alt=""
                  className="size-12 shrink-0 object-cover bg-muted"
                  decoding="async"
                  height={96}
                  src={shopImageSrc(item.image, 96)}
                  width={96}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">
                    {item.color}
                    <span className="text-border"> · </span>
                    {item.size}
                    <span className="text-border"> · </span>
                    ×{item.quantity}
                  </p>
                  {item.custom ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatCustomMeasurements(item.custom)}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 tabular-nums">
                  {formatShopPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Customer
            </h2>
            <dl className="mt-3 divide-y divide-border border border-border text-sm">
              <InfoRow label="Name" value={orderCustomerName(order)} />
              <InfoRow label="Email" value={order.email} />
              <InfoRow label="Phone" value={order.phone} />
            </dl>
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Delivery
            </h2>
            <dl className="mt-3 divide-y divide-border border border-border text-sm">
              <InfoRow label="Method" value={order.shippingLabel} />
              <InfoRow
                label="Address"
                value={[
                  order.address,
                  [order.city, order.province, order.postal]
                    .filter(Boolean)
                    .join(', '),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </dl>
          </div>
        </section>

        <section className="max-w-md">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Totals
          </h2>
          <dl className="mt-3 divide-y divide-border border border-border text-sm">
            <InfoRow label="Subtotal" value={formatShopPrice(order.subtotal)} />
            {order.discount > 0 ? (
              <InfoRow
                label="Discount"
                value={`−${formatShopPrice(order.discount)}`}
              />
            ) : null}
            <InfoRow
              label="Shipping"
              value={
                order.shipping === 0 ? 'Free' : formatShopPrice(order.shipping)
              }
            />
            <div className="flex items-center justify-between px-4 py-3 font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatShopPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}

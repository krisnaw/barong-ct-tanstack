import * as React from 'react'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { CaretDownIcon } from '@phosphor-icons/react'
import {
  courierLabel,
  courierTrackingUrl,
  couriers,
  formatOrderDate,
  formatPaymentLabel,
  orderCustomerName,
  orderItemCount,
  orderPaymentStatus,
  orderPickupPointName,
  orderStatusLabel,
  adminStatusOptions,
  type AdminOrderStatus,
  type CourierId,
  type OrderPaymentStatus,
  type ShopOrder,
} from '~/data/orders'
import { formatCustomMeasurements, formatShopPrice, shopImageSrc } from '~/data/shop'
import { getOrderById, shipOrder, updateOrderStatus } from '~/lib/order.functions'
import { OrderStatusBadge } from '~/components/order-status-badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { toast } from '~/components/ui/toast'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

const paymentStatusStyles: Record<OrderPaymentStatus, string> = {
  unpaid: 'border-zinc-200 bg-zinc-100 text-zinc-600',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failed: 'border-rose-200 bg-rose-50 text-rose-800',
  expired: 'border-zinc-200 bg-zinc-100 text-zinc-600',
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
  const count = orderItemCount(order)
  const paymentStatus = orderPaymentStatus(order)

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
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {order.id}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {order.delivery === 'pickup' ? null : (
                <AddTrackingDialog order={order} />
              )}
              <ChangeStatusMenu order={order} />
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {orderCustomerName(order)}
            <span className="text-border"> · </span>
            {formatOrderDate(order.placedAt)}
            <span className="text-border"> · </span>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <OrderBlock className="lg:col-span-2" title="Items">
            <ul className="divide-y divide-border">
              {order.lines.map((item) => (
                <li
                  className="flex items-center gap-4 px-4 py-3 text-sm"
                  key={`${item.slug}-${item.size}-${item.custom?.chest ?? ''}`}
                >
                  <img
                    alt=""
                    className="size-12 shrink-0 bg-muted object-cover"
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
          </OrderBlock>

          <div className="flex flex-col gap-4">
            <OrderBlock title="Customer">
              <dl className="divide-y divide-border text-sm">
                <InfoRow label="Name" value={orderCustomerName(order)} />
                <InfoRow label="Email" value={order.email} />
                <InfoRow label="Phone" value={order.phone} />
              </dl>
            </OrderBlock>

            <OrderBlock title="Delivery information">
              <dl className="divide-y divide-border text-sm">
                <InfoRow
                  label="Delivery type"
                  value={
                    order.delivery === 'pickup' ? 'Pick up' : order.shippingLabel
                  }
                />
                {order.delivery === 'pickup' ? (
                  <InfoRow
                    label="Pick up point"
                    value={orderPickupPointName(order) ?? ''}
                  />
                ) : null}
                {order.delivery !== 'pickup' &&
                order.courier &&
                order.trackingNumber ? (
                  <>
                    <InfoRow label="Courier" value={courierLabel(order.courier)} />
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                      <dt className="shrink-0 text-muted-foreground">Tracking</dt>
                      <dd className="text-right break-all">
                        <a
                          className="underline underline-offset-2"
                          href={courierTrackingUrl(
                            order.courier,
                            order.trackingNumber,
                          )}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {order.trackingNumber}
                        </a>
                      </dd>
                    </div>
                  </>
                ) : null}
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
            </OrderBlock>

            <OrderBlock title="Payment information">
              <dl className="divide-y divide-border text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="shrink-0 text-muted-foreground">Status</dt>
                  <dd>
                    <span
                      className={cn(
                        'inline-flex items-center border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
                        paymentStatusStyles[paymentStatus],
                      )}
                    >
                      {paymentStatus}
                    </span>
                  </dd>
                </div>
                <InfoRow label="Method" value={formatPaymentLabel(order)} />
                {order.payment?.transactionId ? (
                  <InfoRow
                    label="Transaction"
                    value={order.payment.transactionId}
                  />
                ) : null}
                <InfoRow label="Subtotal" value={formatShopPrice(order.subtotal)} />
                {order.discount > 0 ? (
                  <InfoRow
                    label="Discount"
                    value={`−${formatShopPrice(order.discount)}`}
                  />
                ) : null}
                <InfoRow
                  label={order.delivery === 'pickup' ? 'Pickup' : 'Shipping'}
                  value={
                    order.shipping === 0 ? 'Free' : formatShopPrice(order.shipping)
                  }
                />
                <div className="flex items-center justify-between px-4 py-3 font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatShopPrice(order.total)}</dd>
                </div>
              </dl>
            </OrderBlock>
          </div>
        </div>
      </div>
    </>
  )
}

function AddTrackingDialog({ order }: { order: ShopOrder }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [courier, setCourier] = React.useState<CourierId>(
    (order.courier as CourierId | undefined) ?? 'jne',
  )
  const [trackingNumber, setTrackingNumber] = React.useState(
    order.trackingNumber ?? '',
  )
  const [saving, setSaving] = React.useState(false)
  const canShip = order.status !== 'cancelled' && order.status !== 'refunded'
  const hasTracking = Boolean(order.courier && order.trackingNumber)

  React.useEffect(() => {
    if (open) {
      setCourier((order.courier as CourierId | undefined) ?? 'jne')
      setTrackingNumber(order.trackingNumber ?? '')
    }
  }, [open, order.courier, order.trackingNumber])

  async function save() {
    const nextTracking = trackingNumber.trim()
    if (nextTracking.length < 4) {
      toast.add({ type: 'error', title: 'Enter a tracking number' })
      return
    }
    setSaving(true)
    try {
      await shipOrder({
        data: {
          id: order.id,
          courier,
          trackingNumber: nextTracking,
        },
      })
      await router.invalidate()
      toast.add({
        type: 'success',
        title: hasTracking ? 'Tracking updated' : 'Order marked as completed',
      })
      setOpen(false)
    } catch {
      toast.add({ type: 'error', title: 'Could not save tracking' })
    } finally {
      setSaving(false)
    }
  }

  if (!canShip) return null

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {hasTracking ? 'Update tracking' : 'Add tracking'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {hasTracking ? 'Update tracking' : 'Add tracking'}
          </DialogTitle>
          <DialogDescription>
            {hasTracking
              ? `Update the courier tracking number for ${order.id}.`
              : `Add a courier tracking number to mark ${order.id} as completed.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="courier">Courier</Label>
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="courier"
              onChange={(event) => setCourier(event.target.value as CourierId)}
              value={courier}
            >
              {couriers.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="trackingNumber">Tracking number</Label>
            <Input
              id="trackingNumber"
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="e.g. 882837192001"
              value={trackingNumber}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={saving || trackingNumber.trim().length < 4}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : hasTracking ? 'Save tracking' : 'Mark as completed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function asAdminStatus(status: ShopOrder['status']): AdminOrderStatus {
  return adminStatusOptions.includes(status as AdminOrderStatus)
    ? (status as AdminOrderStatus)
    : 'pending'
}

function ChangeStatusMenu({ order }: { order: ShopOrder }) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const current = asAdminStatus(order.status)

  async function save(status: AdminOrderStatus) {
    if (status === order.status || saving) return
    setSaving(true)
    try {
      await updateOrderStatus({ data: { id: order.id, status } })
      await router.invalidate()
      toast.add({ type: 'success', title: 'Order status updated' })
    } catch {
      toast.add({ type: 'error', title: 'Could not update status' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={saving}
        render={<Button size="sm" variant="outline" />}
      >
        Change status
        <CaretDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup
          onValueChange={(value) => void save(value as AdminOrderStatus)}
          value={current}
        >
          {adminStatusOptions.map((status) => (
            <DropdownMenuRadioItem key={status} value={status}>
              {orderStatusLabel(status)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function OrderBlock({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('border border-border', className)}>
      <h2 className="border-b border-border px-4 py-3 font-heading text-sm font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right break-all">{value}</dd>
    </div>
  )
}

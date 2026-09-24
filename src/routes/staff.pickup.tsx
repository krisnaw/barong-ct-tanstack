import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PackageIcon,
} from '@phosphor-icons/react'
import { matchesStaffPickupQuery } from '~/data/staff-pickup'
import {
  formatCustomMeasurements,
  shopImageSrc,
} from '~/data/shop'
import {
  formatOrderDate,
  orderCustomerName,
  orderItemCount,
  orderPickupPointName,
  type ShopOrder,
} from '~/data/orders'
import { OrderStatusBadge } from '~/components/order-status-badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { toast } from '~/components/ui/toast'
import { listStaffPickupOrders } from '~/lib/order.functions'
import { listPickupPoints } from '~/lib/pickup-point.functions'
import { DashboardTableSkeleton } from '~/components/page-skeletons'
import { seo } from '~/utils/seo'

const ALL_POINTS = '__all__'

export const Route = createFileRoute('/staff/pickup')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: async () => {
    const [orders, points] = await Promise.all([
      listStaffPickupOrders(),
      listPickupPoints(),
    ])
    return { orders, points }
  },
  head: () => ({
    meta: seo({
      title: 'Pickup desk · Staff | Barong Cycling Team',
      description: 'Mark shop orders collected at pickup points.',
    }),
  }),
  component: StaffPickupPage,
})

function orderItemSummary(order: ShopOrder) {
  return order.lines
    .map((line) => `${line.name} · ${line.color} / ${line.size}`)
    .join(' · ')
}

function StaffPickupPage() {
  const { orders, points } = Route.useLoaderData()
  const searchId = React.useId()
  const pointId = React.useId()
  const [query, setQuery] = React.useState('')
  const [pointFilter, setPointFilter] = React.useState(ALL_POINTS)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [confirmId, setConfirmId] = React.useState<string | null>(null)

  const pickupPointFilterItems = [
    { value: ALL_POINTS, label: 'All points' },
    ...points.map((point) => ({
      value: point.id,
      label: point.name,
    })),
  ]

  const visible = orders.filter((order) => {
    if (pointFilter !== ALL_POINTS && order.pickupPointId !== pointFilter) {
      return false
    }
    return matchesStaffPickupQuery(order, query)
  })
  const detailOrder = orders.find((order) => order.id === detailId) ?? null
  const confirmTarget = orders.find((order) => order.id === confirmId) ?? null

  function requestMarkCollected() {
    toast.add({
      type: 'info',
      title: 'Not connected yet',
      description: 'Marking pickup will be wired in a later step.',
    })
    setConfirmId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          to="/staff"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Staff tools
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Pickup desk
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open an order to check items. Marking as picked up comes next.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor={searchId}>Search</Label>
          <div className="relative">
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8"
              id={searchId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order #, name, or phone"
              value={query}
            />
          </div>
        </div>
        <div className="grid gap-1.5 sm:w-52">
          <Label htmlFor={pointId}>Pickup point</Label>
          <Select
            items={pickupPointFilterItems}
            onValueChange={(value) => {
              if (value == null) return
              setPointFilter(value)
            }}
            value={pointFilter}
          >
            <SelectTrigger className="w-full" id={pointId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {pickupPointFilterItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {visible.length} ready to collect
        {orders.length !== visible.length
          ? ` · ${orders.length} total waiting`
          : null}
      </p>

      {visible.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>No orders to collect</EmptyTitle>
            <EmptyDescription>
              {query || pointFilter !== ALL_POINTS
                ? 'Try another search or pickup point.'
                : 'Paid pickup orders will show up here.'}
            </EmptyDescription>
          </EmptyHeader>
          {(query || pointFilter !== ALL_POINTS) && (
            <EmptyContent>
              <Button
                onClick={() => {
                  setQuery('')
                  setPointFilter(ALL_POINTS)
                }}
                type="button"
                variant="outline"
              >
                Clear filters
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((order) => {
            const count = orderItemCount(order)
            const pointName = orderPickupPointName(order) ?? 'Pickup'
            return (
              <li className="border border-border px-4 py-4" key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium tracking-tight">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm">{orderCustomerName(order)}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.phone}
                      <span className="text-border"> · </span>
                      {pointName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orderItemSummary(order)}
                      <span className="text-border"> · </span>
                      {count} item{count === 1 ? '' : 's'}
                      <span className="text-border"> · </span>
                      Paid {formatOrderDate(order.payment?.paidAt ?? order.placedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      onClick={() => setDetailId(order.id)}
                      type="button"
                      variant="outline"
                    >
                      View details
                    </Button>
                    <Button
                      onClick={() => setConfirmId(order.id)}
                      type="button"
                    >
                      Mark picked up
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        open={detailOrder != null}
      >
        <SheetContent className="gap-0 p-0 sm:max-w-md" side="right">
          {detailOrder ? (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{detailOrder.id}</SheetTitle>
                <SheetDescription>
                  Check items before handing over at{' '}
                  {orderPickupPointName(detailOrder) ?? 'pickup'}.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                <section className="space-y-2">
                  <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Customer
                  </h2>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="text-right font-medium">
                        {orderCustomerName(detailOrder)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="text-right tabular-nums">
                        {detailOrder.phone}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="text-right break-all">
                        {detailOrder.email}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Paid</dt>
                      <dd className="text-right">
                        {formatOrderDate(
                          detailOrder.payment?.paidAt ?? detailOrder.placedAt,
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Pickup</dt>
                      <dd className="text-right">
                        {orderPickupPointName(detailOrder) ?? '—'}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="space-y-2">
                  <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Items ({orderItemCount(detailOrder)})
                  </h2>
                  <ul className="divide-y divide-border border border-border">
                    {detailOrder.lines.map((line, index) => (
                      <li
                        className="flex gap-4 px-3 py-3"
                        key={`${detailOrder.id}-${line.slug}-${line.size}-${index}`}
                      >
                        <img
                          alt=""
                          className="size-16 shrink-0 object-cover sm:size-20"
                          decoding="async"
                          height={160}
                          src={shopImageSrc(line.image, 160)}
                          width={160}
                        />
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium tracking-tight">
                              {line.name}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {line.color}
                              <span className="text-border"> · </span>
                              Size {line.size}
                              {line.preOrder ? (
                                <>
                                  <span className="text-border"> · </span>
                                  Pre order
                                </>
                              ) : null}
                            </p>
                            {line.custom ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Custom: {formatCustomMeasurements(line.custom)}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 tabular-nums text-sm font-medium">
                            ×{line.quantity}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <SheetFooter className="border-t border-border">
                <Button
                  className="w-full"
                  onClick={() => setConfirmId(detailOrder.id)}
                  type="button"
                >
                  Mark picked up
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setConfirmId(null)
        }}
        open={confirmId != null}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm pickup?</DialogTitle>
            <DialogDescription>
              {confirmTarget
                ? `Mark ${confirmTarget.id} for ${orderCustomerName(confirmTarget)} as collected at ${orderPickupPointName(confirmTarget) ?? 'pickup'}. This action is not saved yet.`
                : 'Mark this order as collected. This action is not saved yet.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={requestMarkCollected} type="button">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import * as React from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
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
} from '~/data/orders'
import { OrderStatusBadge } from '~/components/order-status-badge'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
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
import {
  listStaffPickupOrders,
  markPickupCollected,
  markPickupReady,
} from '~/lib/order.functions'
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
      description: 'Tell customers when a pickup order is ready, then mark it collected.',
    }),
  }),
  component: StaffPickupPage,
})

function StaffPickupPage() {
  const { orders, points } = Route.useLoaderData()
  const router = useRouter()
  const searchId = React.useId()
  const pointId = React.useId()
  const [query, setQuery] = React.useState('')
  const [pointFilter, setPointFilter] = React.useState(ALL_POINTS)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [confirm, setConfirm] = React.useState<{
    id: string
    action: 'ready' | 'collected'
  } | null>(null)
  const [saving, setSaving] = React.useState(false)

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
  const confirmTarget = orders.find((order) => order.id === confirm?.id) ?? null
  const readyCount = visible.filter((order) => order.status === 'ready').length

  async function confirmAction() {
    if (!confirm || saving) return
    setSaving(true)
    try {
      if (confirm.action === 'ready') {
        await markPickupReady({ data: { id: confirm.id } })
        toast.add({
          type: 'success',
          title: 'Customer notified',
          description: 'The order is ready to collect.',
        })
      } else {
        await markPickupCollected({ data: { id: confirm.id } })
        toast.add({ type: 'success', title: 'Marked as picked up' })
        if (detailId === confirm.id) setDetailId(null)
      }
      setConfirm(null)
      await router.invalidate()
    } catch {
      toast.add({
        type: 'error',
        title:
          confirm.action === 'ready'
            ? 'Could not mark ready'
            : 'Could not mark picked up',
      })
    } finally {
      setSaving(false)
    }
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
          Mark an order ready to email the customer. Mark it picked up after
          they collect it.
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
        {visible.length} waiting
        {readyCount > 0 ? ` · ${readyCount} ready to collect` : null}
        {orders.length !== visible.length
          ? ` · ${orders.length} total`
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
            return (
              <li className="border border-border px-4 py-4" key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium tracking-tight">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm">{orderCustomerName(order)}</p>
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
                      onClick={() =>
                        setConfirm({
                          id: order.id,
                          action: order.status === 'ready' ? 'collected' : 'ready',
                        })
                      }
                      type="button"
                    >
                      {order.status === 'ready' ? 'Mark picked up' : 'Mark ready'}
                    </Button>
                  </div>
                </div>
                <Table className="mt-3 w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 w-full px-2 text-xs">Item</TableHead>
                      <TableHead className="h-8 px-2 text-xs">Size</TableHead>
                      <TableHead className="h-8 px-2 text-right text-xs">
                        Qty
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.lines.map((line, index) => (
                      <TableRow
                        key={`${order.id}-${line.slug}-${line.size}-${index}`}
                      >
                        <TableCell className="w-full px-2 py-2 whitespace-normal">
                          {line.name}
                        </TableCell>
                        <TableCell className="px-2 py-2">{line.size}</TableCell>
                        <TableCell className="px-2 py-2 text-right tabular-nums">
                          {line.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  onClick={() =>
                    setConfirm({
                      id: detailOrder.id,
                      action:
                        detailOrder.status === 'ready' ? 'collected' : 'ready',
                    })
                  }
                  type="button"
                >
                  {detailOrder.status === 'ready'
                    ? 'Mark picked up'
                    : 'Mark ready'}
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        onOpenChange={(open) => {
          if (!open && !saving) setConfirm(null)
        }}
        open={confirm != null}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirm?.action === 'collected'
                ? 'Confirm pickup?'
                : 'Mark ready to collect?'}
            </DialogTitle>
            <DialogDescription>
              {confirm?.action === 'collected'
                ? confirmTarget
                  ? `Mark ${confirmTarget.id} for ${orderCustomerName(confirmTarget)} as collected at ${orderPickupPointName(confirmTarget) ?? 'pickup'}.`
                  : 'Mark this order as collected.'
                : confirmTarget
                  ? `Email ${orderCustomerName(confirmTarget)} that ${confirmTarget.id} is ready to collect at ${orderPickupPointName(confirmTarget) ?? 'pickup'}.`
                  : 'Email the customer that this order is ready to collect.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button disabled={saving} type="button" variant="outline" />
              }
            >
              Cancel
            </DialogClose>
            <Button disabled={saving} onClick={() => void confirmAction()} type="button">
              {saving ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : confirm?.action === 'collected' ? (
                'Mark picked up'
              ) : (
                'Mark ready'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

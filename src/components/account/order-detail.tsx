import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  TruckIcon,
} from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import { OrderStatusBadge } from '~/components/order-status-badge'
import {
  courierLabel,
  formatOrderDate,
  formatPaymentLabel,
  orderCustomerName,
  orderItemCount,
  orderNeedsPayment,
  orderPickupPointName,
  type ShopOrder,
} from '~/data/orders'
import { formatCustomMeasurements, formatShopPrice, shopImageSrc } from '~/data/shop'
import { toast } from '~/components/ui/toast'
import { Spinner } from '~/components/ui/spinner'
import { startPayment } from '~/lib/payment.functions'

export function AccountOrderDetailPanel({ order }: { order: ShopOrder }) {
  const count = orderItemCount(order)

  return (
    <div>
      <Link
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        to="/account/orders"
      >
        <ArrowLeftIcon className="size-3.5" weight="bold" />
        Back to orders
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {order.id}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        {orderNeedsPayment(order) ? <PayNowButton order={order} /> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatOrderDate(order.placedAt)}
        <span className="text-border"> · </span>
        {count} {count === 1 ? 'item' : 'items'}
      </p>

      <ul className="mt-6 divide-y divide-border border-y border-border">
        {order.lines.map((line) => (
          <li
            className="flex items-start gap-4 py-5"
            key={`${order.id}-${line.slug}-${line.size}-${line.custom?.chest ?? ''}`}
          >
            <img
              alt=""
              className="size-16 shrink-0 object-cover bg-muted sm:size-20"
              height={160}
              src={shopImageSrc(line.image, 160)}
              width={160}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {line.quantity} × {line.name}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {line.color}, size {line.size}
                {line.preOrder ? ', pre order' : ''}
              </p>
              {line.custom ? (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatCustomMeasurements(line.custom)}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-medium tabular-nums">
              {formatShopPrice(line.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CreditCardIcon className="size-4" weight="bold" />
            Payment information
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            {order.payment?.transactionId ? (
              <div>
                <dt className="font-medium">Payment ID</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {order.payment.transactionId}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium">Method</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {formatPaymentLabel(order)}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <TruckIcon className="size-4" weight="bold" />
            Delivery information
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium">Delivery type</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {order.delivery === 'pickup' ? 'Pick up' : order.shippingLabel}
              </dd>
            </div>
            {order.delivery === 'pickup' ? (
              <div>
                <dt className="font-medium">Pick up point</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {orderPickupPointName(order)}
                </dd>
              </div>
            ) : null}
            {order.delivery !== 'pickup' &&
            order.courier &&
            order.trackingNumber ? (
              <div>
                <dt className="font-medium">Tracking</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {courierLabel(order.courier)}
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span>{order.trackingNumber}</span>
                    <CopyTrackingButton trackingNumber={order.trackingNumber} />
                  </div>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium">Address</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {order.delivery === 'pickup' ? null : (
                  <>
                    {orderCustomerName(order)}
                    <br />
                  </>
                )}
                {order.address}
                <br />
                {[order.city, order.province, order.postal]
                  .filter(Boolean)
                  .join(' ')}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Summary</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Products</dt>
              <dd className="tabular-nums">{formatShopPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">
                  −{formatShopPrice(order.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {order.shipping === 0 ? 'Free' : formatShopPrice(order.shipping)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatShopPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

function CopyTrackingButton({ trackingNumber }: { trackingNumber: string }) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopied(true)
      toast.add({ type: 'success', title: 'Tracking number copied' })
    } catch {
      toast.add({ type: 'error', title: 'Could not copy tracking number' })
    }
  }

  return (
    <Button
      onClick={() => void copy()}
      size="xs"
      type="button"
      variant="ghost"
    >
      {copied ? (
        <CheckIcon data-icon="inline-start" weight="bold" />
      ) : (
        <CopyIcon data-icon="inline-start" weight="bold" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

function PayNowButton({ order }: { order: ShopOrder }) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')
  async function pay() {
    setPending(true)
    setError('')
    try {
      const started = await startPayment({
        data: {
          orderNumber: order.id,
          methodId: order.payment?.method === 'card' ? 'card' : 'qris',
        },
      })
      window.location.assign(started.url)
    } catch (caught) {
      setPending(false)
      setError(caught instanceof Error ? caught.message : 'Could not start payment')
    }
  }

  return (
    <div>
      <Button disabled={pending} onClick={() => void pay()} type="button">
        {pending ? (<><Spinner /> Redirecting…</>) : `Pay ${formatShopPrice(order.total)}`}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

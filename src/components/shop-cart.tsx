import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { MinusIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { buttonVariants } from '~/components/ui/button'
import {
  formatShopPrice,
  getShopProduct,
  shopImageSrc,
  type ShopProduct,
} from '~/data/shop'
import { useCart, type CartItem } from '~/lib/cart'
import { cn } from '~/lib/utils'

type CartLine = CartItem & { product: ShopProduct }

function useCartLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getShopProduct(item.slug)
    if (!product) return []
    return [{ ...item, product }]
  })
}

export function ShopCart() {
  const { items, setQuantity, removeItem, ready } = useCart()
  const lines = useCartLines(items)

  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )

  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Shop
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Bag
          </h1>
        </div>
        {ready && lines.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {lines.reduce((sum, line) => sum + line.quantity, 0)}{' '}
            {lines.reduce((sum, line) => sum + line.quantity, 0) === 1
              ? 'item'
              : 'items'}
          </p>
        ) : null}
      </div>

      {!ready ? (
        <p className="border-y border-border py-10 text-sm text-muted-foreground">
          Loading bag…
        </p>
      ) : lines.length === 0 ? (
        <EmptyBag />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-10">
          <ul className="divide-y divide-border border-y border-border">
            {lines.map((line) => (
              <CartRow
                key={`${line.slug}-${line.size}`}
                line={line}
                onQuantity={(quantity) =>
                  setQuantity(line.slug, line.size, quantity)
                }
                onRemove={() => removeItem(line.slug, line.size)}
              />
            ))}
          </ul>

          <aside className="border border-border p-5 sm:p-6 lg:sticky lg:top-6">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Summary
            </p>
            <div className="mt-4 flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-heading text-xl font-semibold tabular-nums">
                {formatShopPrice(subtotal)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Pickup at the club meet point, or ship within Indonesia.
            </p>
            <Link
              className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full')}
              to="/shop/checkout"
            >
              Check out
            </Link>
          </aside>
        </div>
      )}
    </section>
  )
}

function CartRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine
  onQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  return (
    <li className="flex gap-4 py-3 sm:gap-4 sm:py-4">
      <Link
        className="shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        params={{ slug: line.slug }}
        to="/shop/$slug"
      >
        <img
          alt=""
          className="size-16 object-cover sm:size-20"
          decoding="async"
          height={160}
          src={shopImageSrc(line.product.image, 160)}
          width={160}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              className="font-heading text-base font-semibold tracking-tight hover:underline"
              params={{ slug: line.slug }}
              to="/shop/$slug"
            >
              {line.product.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Size {line.size}
              <span className="text-border"> · </span>
              {line.product.color}
            </p>
          </div>
          <p className="shrink-0 text-sm font-medium tabular-nums">
            {formatShopPrice(line.product.price * line.quantity)}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center border border-border">
            <button
              aria-label={`Decrease ${line.product.name} ${line.size}`}
              className="grid size-8 place-items-center text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onQuantity(line.quantity - 1)}
              type="button"
            >
              <MinusIcon className="size-3.5" weight="bold" />
            </button>
            <span className="min-w-6 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              aria-label={`Increase ${line.product.name} ${line.size}`}
              className="grid size-8 place-items-center text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onQuantity(line.quantity + 1)}
              type="button"
            >
              <PlusIcon className="size-3.5" weight="bold" />
            </button>
          </div>

          <button
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={onRemove}
            type="button"
          >
            <TrashIcon aria-hidden className="size-3.5" weight="bold" />
            Remove
          </button>
        </div>
      </div>
    </li>
  )
}

function EmptyBag() {
  return (
    <div className="border-y border-border py-12 text-center">
      <p className="font-heading text-lg font-medium tracking-tight">
        Bag is empty
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse club jerseys and add a size.
      </p>
      <Link
        className={cn(buttonVariants(), 'mt-6')}
        to="/shop"
      >
        Shop jerseys
      </Link>
    </div>
  )
}

import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import { CartRow, useCartLines } from '~/components/shop-cart'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { formatShopPrice, type ShopProduct } from '~/data/shop'
import { cartLineKey, useCart, useCartCount } from '~/lib/cart'
import { listProducts } from '~/lib/shop.functions'
import { cn } from '~/lib/utils'

export function CartSheet() {
  const {
    items,
    setQuantity,
    removeItem,
    ready,
    sheetOpen,
    setSheetOpen,
    closeSheet,
  } = useCart()
  const { count } = useCartCount()
  const [products, setProducts] = React.useState<ShopProduct[]>([])
  const [loadingProducts, setLoadingProducts] = React.useState(false)

  React.useEffect(() => {
    if (!sheetOpen) return
    let cancelled = false
    setLoadingProducts(true)
    void listProducts({ data: { activeOnly: true } })
      .then((next) => {
        if (!cancelled) setProducts(next)
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheetOpen])

  const lines = useCartLines(items, products)
  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )
  const itemCount = ready ? count : 0
  const showLines = ready && !loadingProducts && lines.length > 0

  return (
    <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
      <SheetContent
        className="gap-0 p-0 sm:max-w-md"
        showCloseButton={false}
        side="right"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={closeSheet}
              to="/shop"
            >
              <ArrowLeftIcon aria-hidden className="size-3.5" weight="bold" />
              Continue shopping
            </Link>
            <SheetTitle className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Bag{itemCount > 0 ? `: ${itemCount}` : ''}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Review items in your bag and check out.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            {!ready || loadingProducts ? (
              <p className="py-10 text-sm text-muted-foreground">Loading bag…</p>
            ) : lines.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-heading text-lg font-medium tracking-tight">
                  Bag is empty
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse club jerseys and add a size.
                </p>
                <Button
                  className="mt-6"
                  onClick={closeSheet}
                  render={<Link to="/shop" />}
                >
                  Shop jerseys
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {lines.map((line) => (
                  <CartRow
                    compact
                    key={cartLineKey(line)}
                    line={line}
                    onNavigate={closeSheet}
                    onQuantity={(quantity) =>
                      setQuantity(line.slug, line.size, quantity, line.custom)
                    }
                    onRemove={() =>
                      removeItem(line.slug, line.size, line.custom)
                    }
                  />
                ))}
              </ul>
            )}
          </div>

          {showLines ? (
            <div className="shrink-0 border-t border-border px-4 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-heading text-lg font-semibold tabular-nums">
                  {formatShopPrice(subtotal)}
                </span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-4 text-xs text-muted-foreground">
                <span>Pickup</span>
                <span className="text-right">Chosen at checkout</span>
              </div>
              <Link
                className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full')}
                onClick={closeSheet}
                to="/shop/checkout"
              >
                Check out
              </Link>
              <Link
                className="mt-3 block text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={closeSheet}
                to="/shop/cart"
              >
                View full bag
              </Link>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

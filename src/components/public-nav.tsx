import { Link, useRouterState } from '@tanstack/react-router'
import { ShoppingBagIcon } from '@phosphor-icons/react'
import { useCartCount } from '~/lib/cart'
import { cn } from '~/lib/utils'

export function PublicNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onEvents = pathname === '/events' || pathname.startsWith('/events/')
  const onShop = pathname === '/shop' || pathname.startsWith('/shop/')
  const onCart = pathname === '/shop/cart'
  const { count, ready } = useCartCount()

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-12">
        <Link
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          to="/"
        >
          <span className="grid size-8 place-items-center rounded-full bg-foreground font-heading text-sm font-semibold tracking-tight text-background">
            B
          </span>
          <span className="font-heading text-sm font-medium tracking-wide uppercase">
            Barong
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-7 text-sm">
          <Link
            className={cn(
              'text-muted-foreground transition-colors hover:text-foreground',
              onEvents && 'font-medium text-foreground',
            )}
            to="/events"
          >
            Events
          </Link>
          <Link
            className={cn(
              'text-muted-foreground transition-colors hover:text-foreground',
              onShop && !onCart && 'font-medium text-foreground',
            )}
            to="/shop"
          >
            Shop
          </Link>
          <Link
            aria-label={
              ready && count > 0
                ? `Bag, ${count} ${count === 1 ? 'item' : 'items'}`
                : 'Bag'
            }
            className={cn(
              'relative text-muted-foreground transition-colors hover:text-foreground',
              onCart && 'text-foreground',
            )}
            to="/shop/cart"
          >
            <ShoppingBagIcon
              aria-hidden
              className="size-5"
              weight={onCart || (ready && count > 0) ? 'fill' : 'regular'}
            />
            {ready && count > 0 ? (
              <span className="absolute -top-1.5 -right-2 grid min-w-4 place-items-center rounded-full bg-foreground px-1 text-[0.65rem] leading-4 font-medium text-background tabular-nums">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  )
}

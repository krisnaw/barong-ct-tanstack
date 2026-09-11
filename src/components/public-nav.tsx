import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ListIcon, ShoppingBagIcon } from '@phosphor-icons/react'
import { AccountMenu } from '~/components/account-menu'
import { LanguageToggle } from '~/components/language-toggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import { useCartCount } from '~/lib/cart'
import { cn } from '~/lib/utils'

export function PublicNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onEvents = pathname === '/events' || pathname.startsWith('/events/')
  const onShop = pathname === '/shop' || pathname.startsWith('/shop/')
  const onCart = pathname === '/shop/cart'
  const { count, ready } = useCartCount()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = (active: boolean) =>
    cn(
      'text-muted-foreground transition-colors hover:text-foreground',
      active && 'font-medium text-foreground',
    )

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <Link
          className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          to="/"
        >
          <img
            alt="Barong Cycling Team"
            className="h-9 w-auto"
            height={36}
            src="/barong_logo.png"
            width={28}
          />
        </Link>

        <div className="flex items-center gap-5">
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-sm md:flex"
          >
            <Link className={linkClass(onEvents)} to="/events">
              Events
            </Link>
            <Link className={linkClass(onShop && !onCart)} to="/shop">
              Shop
            </Link>
          </nav>

          <div className="flex items-center gap-4 sm:gap-5">
            <LanguageToggle />
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
            <AccountMenu />

            <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
              <SheetTrigger
                aria-label="Open menu"
                className="inline-flex cursor-pointer text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
              >
                <ListIcon aria-hidden className="size-5" weight="bold" />
              </SheetTrigger>
              <SheetContent className="gap-0 p-0" side="right">
                <SheetHeader className="border-b border-border">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav
                  aria-label="Mobile"
                  className="flex flex-col gap-1 px-3 py-4 text-base"
                >
                  <Link
                    className={cn(
                      'rounded-md px-3 py-3 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                      linkClass(onEvents),
                    )}
                    onClick={() => setMenuOpen(false)}
                    to="/events"
                  >
                    Events
                  </Link>
                  <Link
                    className={cn(
                      'rounded-md px-3 py-3 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                      linkClass(onShop && !onCart),
                    )}
                    onClick={() => setMenuOpen(false)}
                    to="/shop"
                  >
                    Shop
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

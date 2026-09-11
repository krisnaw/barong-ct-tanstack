import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ListIcon, ShoppingBagIcon } from '@phosphor-icons/react'
import { AccountMenu } from '~/components/account-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import { useCartCount } from '~/lib/cart'
import { useTranslations } from '~/lib/i18n'
import { cn } from '~/lib/utils'

export function PublicNav() {
  const t = useTranslations()
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

  const bagLabel =
    ready && count > 0
      ? t.nav.bagWithCount
          .replace('{count}', String(count))
          .replace(
            '{items}',
            count === 1 ? t.nav.bagItem : t.nav.bagItems,
          )
      : t.nav.bag

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
            aria-label={t.nav.primary}
            className="hidden items-center gap-7 text-sm md:flex"
          >
            <Link className={linkClass(onEvents)} to="/events">
              {t.nav.events}
            </Link>
            <Link className={linkClass(onShop && !onCart)} to="/shop">
              {t.nav.shop}
            </Link>
          </nav>

          <div className="flex items-center gap-4 sm:gap-5">
            <Link
              aria-label={bagLabel}
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
                aria-label={t.nav.openMenu}
                className="inline-flex cursor-pointer text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
              >
                <ListIcon aria-hidden className="size-5" weight="bold" />
              </SheetTrigger>
              <SheetContent className="gap-0 p-0" side="right">
                <SheetHeader className="border-b border-border">
                  <SheetTitle>{t.nav.menu}</SheetTitle>
                </SheetHeader>
                <nav
                  aria-label={t.nav.mobile}
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
                    {t.nav.events}
                  </Link>
                  <Link
                    className={cn(
                      'rounded-md px-3 py-3 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                      linkClass(onShop && !onCart),
                    )}
                    onClick={() => setMenuOpen(false)}
                    to="/shop"
                  >
                    {t.nav.shop}
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

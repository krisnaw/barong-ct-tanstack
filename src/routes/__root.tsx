/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { CartSheet } from '~/components/cart-sheet'
import { Footer } from '~/components/footer'
import { NotFound } from '~/components/NotFound'
import { PublicNav } from '~/components/public-nav'
import { Toaster } from '~/components/ui/toast'
import { VerifyEmailBanner } from '~/components/verify-email-banner'
import { AccountProvider } from '~/lib/account'
import { CartProvider } from '~/lib/cart'
import { LocaleProvider } from '~/lib/i18n'
import appCss from '~/styles/app.css?url'
import { seo } from '~/utils/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'Barong Cycling Team | Ride Bali',
        description:
          'Denpasar peloton since 2016. Tuesday Quickie, Thursday Foreplay, Saturday Climax — keep the bunch together.',
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Toaster>
          <LocaleProvider>
            <CartProvider>
              <AccountProvider>
                <SiteNav />
                <div className="flex-1">{children}</div>
                <SiteFooter />
                <CartSheet />
              </AccountProvider>
            </CartProvider>
          </LocaleProvider>
        </Toaster>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

function isAppShellRoute(pathname: string) {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/shop/checkout')
  )
}

function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (isAppShellRoute(pathname)) return null
  return (
    <>
      <PublicNav />
      <VerifyEmailBanner />
    </>
  )
}

function SiteFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (isAppShellRoute(pathname)) return null
  return <Footer />
}

import type { ReactNode } from 'react'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { Button, buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export function NotFound({ children }: { children?: ReactNode }) {
  const router = useRouter()
  const inDashboard = useRouterState({
    select: (state) => state.location.pathname.startsWith('/dashboard'),
  })

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-3xl flex-col justify-center px-5 py-20 sm:px-8">
      <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
        404
      </p>
      <h1 className="mt-3 max-w-xl font-heading text-[clamp(2.75rem,7vw,4.75rem)] leading-[0.92] font-semibold tracking-[-0.05em]">
        Page not found
      </h1>
      <div aria-hidden className="mt-6 h-px w-16 bg-foreground" />
      <div className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children ?? (
          <p>
            This address does not match a page on Barong Cycling Team.
          </p>
        )}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          className="h-11 px-5"
          onClick={() => router.history.back()}
          size="lg"
          type="button"
        >
          <ArrowLeftIcon aria-hidden weight="bold" />
          Go back
        </Button>
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-5')}
          to={inDashboard ? '/dashboard' : '/'}
        >
          {inDashboard ? 'Dashboard' : 'Home'}
        </Link>
      </div>
    </main>
  )
}

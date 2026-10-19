import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

export function StatusBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-current/30 bg-transparent px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  )
}

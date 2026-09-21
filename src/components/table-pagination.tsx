import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import { cn } from '~/lib/utils'

export const TABLE_PAGE_SIZE = 10

type TablePaginationProps = {
  /** Zero-based page index */
  pageIndex: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
  className?: string
}

export function TablePagination({
  pageIndex,
  pageCount,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (pageCount <= 1) return null

  const page = pageIndex + 1
  const canPrevious = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  return (
    <Pagination className={cn('justify-end', className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={!canPrevious}
            className={
              canPrevious ? undefined : 'pointer-events-none opacity-50'
            }
            href="#"
            onClick={(event) => {
              event.preventDefault()
              if (canPrevious) onPageChange(pageIndex - 1)
            }}
          />
        </PaginationItem>
        {getPageItems(page, pageCount).map((item, index) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={item === page}
                onClick={(event) => {
                  event.preventDefault()
                  onPageChange(item - 1)
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            aria-disabled={!canNext}
            className={canNext ? undefined : 'pointer-events-none opacity-50'}
            href="#"
            onClick={(event) => {
              event.preventDefault()
              if (canNext) onPageChange(pageIndex + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function getPageItems(
  current: number,
  total: number,
): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const items: Array<number | 'ellipsis'> = [1]

  if (current > 3) items.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (current < total - 2) items.push('ellipsis')

  items.push(total)
  return items
}

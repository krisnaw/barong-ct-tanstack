import * as React from 'react'
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  TABLE_PAGE_SIZE,
  TablePagination,
} from '~/components/table-pagination'
import { cn } from '~/lib/utils'

export const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})

export type DataTableFeatures = typeof dataTableFeatures

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  emptyMessage?: string
  getRowId?: (row: TData) => string
  className?: string
  tableClassName?: string
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage = 'No results.',
  getRowId,
  className,
  tableClassName,
}: DataTableProps<TData>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: TABLE_PAGE_SIZE,
  })

  React.useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(data.length / TABLE_PAGE_SIZE))
    setPagination((prev) => {
      const pageIndex = Math.min(prev.pageIndex, pageCount - 1)
      return pageIndex === prev.pageIndex ? prev : { ...prev, pageIndex }
    })
  }, [data.length])

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    state: { pagination },
    onPaginationChange: setPagination,
  })
  const rows = table.getRowModel().rows

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table className={tableClassName}>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={
                      header.column.id === 'actions' ? 'px-4 text-right' : 'px-4'
                    }
                    key={header.id}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      className={
                        cell.column.id === 'actions'
                          ? 'px-4 py-3 text-right'
                          : 'px-4 py-3'
                      }
                      key={cell.id}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 px-4 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
        pageCount={table.getPageCount()}
        pageIndex={pagination.pageIndex}
      />
    </div>
  )
}

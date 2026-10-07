import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarBlankIcon } from '@phosphor-icons/react'
import { endOfDay, format, startOfDay } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import { CUSTOM_SIZE, jerseySizeGuide, shopImageSrc } from '~/data/shop'
import {
  listOrderedSizes,
  type OrderedSizeLine,
  type OrderedSizeProduct,
  type OrderedSizeSource,
  type OrderedSizeSummary,
} from '~/lib/order.functions'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { DashboardTableSkeleton } from '~/components/page-skeletons'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/orders/sizes')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: () => listOrderedSizes(),
  head: () => ({
    meta: seo({
      title: 'Ordered sizes · Dashboard | Barong Cycling Team',
      description: 'Jersey sizes ordered for each shop product.',
    }),
  }),
  component: DashboardOrderedSizesPage,
})

function productNote(product: OrderedSizeProduct) {
  const status = product.listed ? (product.active ? null : 'Hidden') : 'Removed'
  const color =
    product.color && product.color !== product.name ? product.color : null
  return [color, status].filter(Boolean).join(' · ')
}

function lineInRange(line: OrderedSizeLine, range: DateRange | undefined) {
  if (!range?.from) return true
  const end = range.to ?? range.from
  const time = new Date(line.placedAt).getTime()
  return (
    time >= startOfDay(range.from).getTime() && time <= endOfDay(end).getTime()
  )
}

function summarizeOrderedSizes(
  source: OrderedSizeSource,
  range: DateRange | undefined,
): OrderedSizeSummary {
  const quantitiesBySlug = new Map<string, Record<string, number>>()
  const extraSizes = new Set<string>()
  const orphans = new Map<
    string,
    { name: string; color: string; image: string }
  >()

  for (const line of source.lines) {
    if (!lineInRange(line, range)) continue
    const quantities = quantitiesBySlug.get(line.slug) ?? {}
    quantities[line.size] = (quantities[line.size] ?? 0) + line.quantity
    quantitiesBySlug.set(line.slug, quantities)
    if (
      !jerseySizeGuide.sizes.includes(line.size) &&
      line.size !== CUSTOM_SIZE
    ) {
      extraSizes.add(line.size)
    }
    if (!orphans.has(line.slug)) {
      orphans.set(line.slug, {
        name: line.name,
        color: line.color,
        image: line.image,
      })
    }
  }

  const knownSlugs = new Set(source.products.map((product) => product.slug))
  const products: OrderedSizeProduct[] = source.products.map((product) => {
    const quantities = quantitiesBySlug.get(product.slug) ?? {}
    const total = Object.values(quantities).reduce((sum, count) => sum + count, 0)
    return { ...product, quantities, total }
  })

  for (const [slug, quantities] of quantitiesBySlug) {
    if (knownSlugs.has(slug)) continue
    const orphan = orphans.get(slug)
    const total = Object.values(quantities).reduce((sum, count) => sum + count, 0)
    products.push({
      id: slug,
      slug,
      name: orphan?.name ?? slug,
      color: orphan?.color ?? '',
      image: orphan?.image ?? '',
      active: false,
      listed: false,
      quantities,
      total,
    })
  }

  return {
    sizes: [...jerseySizeGuide.sizes, CUSTOM_SIZE, ...[...extraSizes].sort()],
    products: products.filter((product) => product.total > 0),
  }
}

function rangeLabel(range: DateRange | undefined) {
  if (!range?.from) return 'All dates'
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, 'd MMM yyyy')
  }
  return `${format(range.from, 'd MMM yyyy')} – ${format(range.to, 'd MMM yyyy')}`
}

function csvFilename(range: DateRange | undefined) {
  if (!range?.from) return 'ordered-sizes.csv'
  const from = format(range.from, 'yyyy-MM-dd')
  const to = format(range.to ?? range.from, 'yyyy-MM-dd')
  return from === to
    ? `ordered-sizes-${from}.csv`
    : `ordered-sizes-${from}-${to}.csv`
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

function orderedSizesCsv(summary: OrderedSizeSummary) {
  const { sizes, products } = summary
  const columnTotals = sizes.map((size) =>
    products.reduce((sum, product) => sum + (product.quantities[size] ?? 0), 0),
  )
  const grandTotal = products.reduce((sum, product) => sum + product.total, 0)
  const rows = [
    ['Product', ...sizes, 'Total'],
    ...products.map((product) => [
      product.name,
      ...sizes.map((size) => String(product.quantities[size] ?? 0)),
      String(product.total),
    ]),
    ['Total', ...columnTotals.map(String), String(grandTotal)],
  ]
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

function downloadOrderedSizesCsv(
  summary: OrderedSizeSummary,
  range: DateRange | undefined,
) {
  const blob = new Blob([`\uFEFF${orderedSizesCsv(summary)}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = csvFilename(range)
  link.click()
  URL.revokeObjectURL(url)
}

function DashboardOrderedSizesPage() {
  const source = Route.useLoaderData()
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [rangeOpen, setRangeOpen] = React.useState(false)
  const summary = React.useMemo(
    () => summarizeOrderedSizes(source, range),
    [source, range],
  )
  const { sizes, products } = summary
  const hasOrders = source.lines.length > 0
  const columnTotals = Object.fromEntries(
    sizes.map((size) => [
      size,
      products.reduce((sum, product) => sum + (product.quantities[size] ?? 0), 0),
    ]),
  )
  const grandTotal = products.reduce((sum, product) => sum + product.total, 0)

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Ordered sizes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Ordered sizes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quantity of each size from paid shop orders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Popover onOpenChange={setRangeOpen} open={rangeOpen}>
              <PopoverTrigger
                render={
                  <Button
                    className="justify-start font-normal data-[empty=true]:text-muted-foreground"
                    data-empty={!range?.from}
                    size="sm"
                    type="button"
                    variant="outline"
                  />
                }
              >
                <CalendarBlankIcon weight="bold" />
                {rangeLabel(range)}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  defaultMonth={range?.from}
                  mode="range"
                  numberOfMonths={2}
                  onSelect={setRange}
                  selected={range}
                />
                <div className="flex justify-end border-t border-border p-2">
                  <Button
                    disabled={!range?.from}
                    onClick={() => setRange(undefined)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              disabled={products.length === 0}
              onClick={() => downloadOrderedSizesCsv(summary, range)}
              size="sm"
              variant="outline"
            >
              Download CSV
            </Button>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            {hasOrders
              ? 'No paid orders in this date range.'
              : 'No paid orders yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Product</TableHead>
                  {sizes.map((size) => (
                    <TableHead className="px-4 text-right" key={size}>
                      {size}
                    </TableHead>
                  ))}
                  <TableHead className="px-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const note = productNote(product)
                  return (
                  <TableRow key={product.id}>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            alt=""
                            className="size-10 shrink-0 bg-muted object-cover"
                            decoding="async"
                            height={80}
                            src={shopImageSrc(product.image, 80)}
                            width={80}
                          />
                        ) : (
                          <div className="size-10 shrink-0 bg-muted" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {product.name}
                          </span>
                          {note ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {note}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </TableCell>
                    {sizes.map((size) => {
                      const count = product.quantities[size] ?? 0
                      return (
                        <TableCell
                          className={
                            count === 0
                              ? 'px-4 py-3 text-right text-muted-foreground tabular-nums'
                              : 'px-4 py-3 text-right font-medium tabular-nums'
                          }
                          key={size}
                        >
                          {count}
                        </TableCell>
                      )
                    })}
                    <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                      {product.total}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="px-4 py-3 font-medium">Total</TableCell>
                  {sizes.map((size) => (
                    <TableCell
                      className="px-4 py-3 text-right font-medium tabular-nums"
                      key={size}
                    >
                      {columnTotals[size]}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                    {grandTotal}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}

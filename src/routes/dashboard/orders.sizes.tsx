import { createFileRoute } from '@tanstack/react-router'
import { shopImageSrc } from '~/data/shop'
import {
  listOrderedSizes,
  type OrderedSizeProduct,
} from '~/lib/order.functions'
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

function DashboardOrderedSizesPage() {
  const { sizes, products } = Route.useLoaderData()
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
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Ordered sizes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quantity of each size from paid shop orders.
          </p>
        </div>

        {products.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No paid orders yet.
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

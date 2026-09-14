import { Link, createFileRoute } from '@tanstack/react-router'
import {
  availableSizeCount,
  formatShopPrice,
  shopImageSrc,
} from '~/data/shop'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { buttonVariants } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { listProducts } from '~/lib/shop.functions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/dashboard/catalogue/')({
  loader: () => listProducts({ data: { includeInactive: true } }),
  component: DashboardCataloguePage,
})

function DashboardCataloguePage() {
  const products = Route.useLoaderData()

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
                <BreadcrumbPage>Catalogue</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Catalogue
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} products · Club kit on the public shop
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              to="/shop"
            >
              View public
            </Link>
            <Link
              className={cn(buttonVariants({ size: 'sm' }))}
              to="/dashboard/catalogue/new"
            >
              Add product
            </Link>
          </div>
        </div>

        <ul className="divide-y divide-border border border-border">
          {products.map((product) => (
            <li key={product.slug}>
              <Link
                className="flex items-center gap-4 px-4 py-3 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
                params={{ slug: product.slug }}
                to="/dashboard/catalogue/$slug"
              >
                <img
                  alt=""
                  className="size-12 shrink-0 object-cover bg-muted"
                  decoding="async"
                  height={96}
                  src={shopImageSrc(product.image, 96)}
                  width={96}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">
                    {formatShopPrice(product.price)}
                    {product.preOrder ? (
                      <>
                        <span className="text-border"> · </span>
                        Pre order
                      </>
                    ) : null}
                    {product.active === false ? (
                      <>
                        <span className="text-border"> · </span>
                        Hidden
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="shrink-0 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {product.preOrder
                    ? 'Any size'
                    : `${availableSizeCount(product)} sizes`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

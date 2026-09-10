import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  formatShopPrice,
  getShopProduct,
  shopImageSrc,
} from '~/data/shop'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { buttonVariants } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/catalogue/$slug')({
  loader: ({ params }) => {
    const product = getShopProduct(params.slug)
    if (!product) {
      throw notFound()
    }
    return { product }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.product.name} · Dashboard | Barong Cycling Team`,
          description: loaderData.product.description,
        })
      : undefined,
  }),
  component: DashboardProductDetailPage,
})

function DashboardProductDetailPage() {
  const { product } = Route.useLoaderData()

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/dashboard/catalogue" />}>
                  Catalogue
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="size-3 shrink-0 border border-border"
                style={{ backgroundColor: product.colorHex }}
              />
              <span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                {product.color}
              </span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatShopPrice(product.price)}
              <span className="text-border"> · </span>
              {product.fabric}
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            params={{ slug: product.slug }}
            to="/shop/$slug"
          >
            View public
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
          <img
            alt={product.imageAlt}
            className="aspect-[3/4] w-full max-w-64 object-cover bg-muted"
            decoding="async"
            height={800}
            src={shopImageSrc(product.image, 640)}
            width={480}
          />
          <div className="space-y-6">
            <section>
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Description
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Sizes
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <li
                    className="border border-border px-3 py-1.5 text-sm"
                    key={size}
                  >
                    {size}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>

        {product.images.length > 1 ? (
          <section>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Gallery
            </h2>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:max-w-xl sm:grid-cols-4">
              {product.images.map((image) => (
                <li key={image}>
                  <img
                    alt=""
                    className="aspect-square w-full object-cover bg-muted"
                    decoding="async"
                    height={200}
                    src={shopImageSrc(image, 240)}
                    width={200}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  )
}

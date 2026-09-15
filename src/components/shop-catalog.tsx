import { Link } from '@tanstack/react-router'
import { formatShopPrice, shopImageSrc, type ShopProduct } from '~/data/shop'

export function ShopCatalog({ products }: { products: ShopProduct[] }) {
  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 sm:mb-10">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Shop
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Club kit
        </h1>
      </div>

      <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              className="group block outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              params={{ slug: product.slug }}
              to="/shop/$slug"
            >
              <div className="relative overflow-hidden bg-muted">
                <img
                  alt={product.imageAlt}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  decoding="async"
                  height={1200}
                  src={shopImageSrc(product.image, 900)}
                  width={900}
                />
                {product.preOrder || product.membersOnly ? (
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {product.preOrder ? (
                      <span className="bg-foreground px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.16em] text-background uppercase">
                        Pre order
                      </span>
                    ) : null}
                    {product.membersOnly ? (
                      <span className="bg-foreground px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.16em] text-background uppercase">
                        Verified members only
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="mt-3">
                <h2 className="font-heading text-sm font-medium tracking-tight">
                  {product.name}
                </h2>
                <p className="mt-0.5 text-sm tabular-nums">
                  {formatShopPrice(product.price)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { CheckIcon } from '@phosphor-icons/react'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  formatShopPrice,
  jerseySizeGuide,
  shopImageSrc,
  type ShopProduct,
} from '~/data/shop'
import { useAccount } from '~/lib/account'
import { useCart } from '~/lib/cart'
import { cn } from '~/lib/utils'
import { toast } from '~/components/ui/toast'

export function ShopProductDetail({ product }: { product: ShopProduct }) {
  const { addItem } = useCart()
  const { profile, signedIn } = useAccount()
  const [size, setSize] = React.useState('')
  const [added, setAdded] = React.useState(false)
  const [activeImage, setActiveImage] = React.useState(0)
  const gallery = product.images.length > 0 ? product.images : [product.image]
  const currentImage = gallery[activeImage] ?? product.image
  const savedSize =
    signedIn && profile?.jerseySize && product.sizes.includes(profile.jerseySize)
      ? profile.jerseySize
      : ''

  function handleAdd() {
    if (!size) return
    addItem(product.slug, size)
    setAdded(true)
    toast.add({
      type: 'success',
      title: 'Added to bag',
      description: `${product.name} · Size ${size}`,
    })
  }

  React.useEffect(() => {
    setAdded(false)
    setActiveImage(0)
    setSize(savedSize)
  }, [product.slug])

  React.useEffect(() => {
    if (!savedSize) return
    setSize((current) => current || savedSize)
  }, [savedSize])

  return (
    <article>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-12 lg:py-12">
        <div className="max-w-md">
          <div className="overflow-hidden bg-muted">
            <img
              alt={
                activeImage === 0
                  ? product.imageAlt
                  : `${product.name}, view ${activeImage + 1}`
              }
              className="aspect-[4/5] w-full object-cover"
              decoding="async"
              height={880}
              src={shopImageSrc(currentImage, 900)}
              width={900}
            />
          </div>

          {gallery.length > 1 ? (
            <ul className="mt-2 flex gap-2 overflow-x-auto">
              {gallery.map((src, index) => {
                const selected = activeImage === index
                return (
                  <li className="shrink-0" key={src}>
                    <button
                      aria-label={`View image ${index + 1} of ${gallery.length}`}
                      aria-pressed={selected}
                      className={cn(
                        'block size-16 overflow-hidden border bg-muted outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-[4.5rem]',
                        selected
                          ? 'border-foreground'
                          : 'border-transparent hover:border-foreground/40',
                      )}
                      onClick={() => setActiveImage(index)}
                      type="button"
                    >
                      <img
                        alt=""
                        className="size-full object-cover"
                        decoding="async"
                        height={144}
                        src={shopImageSrc(src, 160)}
                        width={144}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <aside className="h-fit lg:sticky lg:top-6">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Jersey
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em]">
            {product.name}
          </h1>
          <p className="mt-2 font-heading text-xl font-medium tracking-tight tabular-nums">
            {formatShopPrice(product.price)}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <dl className="mt-6 border-y border-border py-4">
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Color</dt>
              <dd className="flex items-center gap-2 font-medium">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full border border-border"
                  style={{ backgroundColor: product.colorHex }}
                />
                {product.color}
              </dd>
            </div>
            <div className="mt-2 flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Fabric</dt>
              <dd className="text-right font-medium">{product.fabric}</dd>
            </div>
          </dl>

          <fieldset className="mt-6">
            <legend className="w-full">
              <span className="flex items-center justify-between gap-3">
                <span className="text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
                  Size
                </span>
                <SizeGuide />
              </span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((option) => {
                const active = size === option
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      'min-w-12 border px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={option}
                    onClick={() => {
                      setSize(option)
                      setAdded(false)
                    }}
                    type="button"
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Button
            className="mt-6 w-full"
            disabled={!size}
            onClick={handleAdd}
            size="lg"
            type="button"
          >
            {size ? `Add ${size} to bag` : 'Select a size'}
          </Button>

          {added ? (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-foreground">
              <CheckIcon aria-hidden className="size-4" weight="bold" />
              Added to bag
              <Link className="underline-offset-4 hover:underline" to="/shop/cart">
                View bag
              </Link>
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Same jersey, another size — add it as a second line.
            </p>
          )}

          <Link
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'mt-2 w-full text-muted-foreground',
            )}
            to="/shop"
          >
            Back to shop
          </Link>
        </aside>
      </div>
    </article>
  )
}

function SizeGuide() {
  return (
    <Dialog>
      <DialogTrigger
        className="text-xs text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        nativeButton
      >
        Size guide
      </DialogTrigger>
      <DialogContent className="rounded-none sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Size guide</DialogTitle>
          <DialogDescription>
            Club jersey measurements. All values in {jerseySizeGuide.unit}.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3 text-left font-medium text-muted-foreground">
                  {jerseySizeGuide.unit}
                </th>
                {jerseySizeGuide.sizes.map((size) => (
                  <th
                    className="px-2 py-2 text-center font-medium"
                    key={size}
                    scope="col"
                  >
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jerseySizeGuide.rows.map((row) => (
                <tr
                  className="border-b border-border last:border-0"
                  key={row.label}
                >
                  <th className="py-2 pr-3 text-left font-medium" scope="row">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td
                      className="px-2 py-2 text-center tabular-nums"
                      key={jerseySizeGuide.sizes[index]}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {jerseySizeGuide.note}
        </p>
      </DialogContent>
    </Dialog>
  )
}

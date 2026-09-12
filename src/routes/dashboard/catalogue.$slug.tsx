import * as React from 'react'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import {
  formatShopPrice,
  jerseySizeGuide,
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
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { toast } from '~/components/ui/toast'
import { getProductBySlug, updateProduct } from '~/lib/shop.functions'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/catalogue/$slug')({
  loader: async ({ params }) => {
    const product = await getProductBySlug({
      data: { slug: params.slug, includeInactive: true },
    })
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
  const router = useRouter()
  const [name, setName] = React.useState(product.name)
  const [color, setColor] = React.useState(product.color)
  const [colorHex, setColorHex] = React.useState(product.colorHex)
  const [price, setPrice] = React.useState(String(product.price))
  const [fabric, setFabric] = React.useState(product.fabric)
  const [image, setImage] = React.useState(product.image)
  const [imageAlt, setImageAlt] = React.useState(product.imageAlt)
  const [description, setDescription] = React.useState(product.description)
  const [featuresText, setFeaturesText] = React.useState(
    product.features.join('\n'),
  )
  const [imagesText, setImagesText] = React.useState(product.images.join('\n'))
  const [preOrder, setPreOrder] = React.useState(product.preOrder)
  const [active, setActive] = React.useState(product.active !== false)
  const [sizes, setSizes] = React.useState<string[]>(product.sizes)
  const [stockBySize, setStockBySize] = React.useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        jerseySizeGuide.sizes.map((size) => [
          size,
          String(product.stockBySize[size] ?? 0),
        ]),
      ),
  )
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setName(product.name)
    setColor(product.color)
    setColorHex(product.colorHex)
    setPrice(String(product.price))
    setFabric(product.fabric)
    setImage(product.image)
    setImageAlt(product.imageAlt)
    setDescription(product.description)
    setFeaturesText(product.features.join('\n'))
    setImagesText(product.images.join('\n'))
    setPreOrder(product.preOrder)
    setActive(product.active !== false)
    setSizes(product.sizes)
    setStockBySize(
      Object.fromEntries(
        jerseySizeGuide.sizes.map((size) => [
          size,
          String(product.stockBySize[size] ?? 0),
        ]),
      ),
    )
  }, [product])

  function toggleSize(size: string) {
    setSizes((current) =>
      current.includes(size)
        ? current.filter((value) => value !== size)
        : [...current, size],
    )
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.add({ type: 'error', title: 'Enter a valid price' })
      return
    }
    if (sizes.length === 0) {
      toast.add({ type: 'error', title: 'Select at least one size' })
      return
    }

    setSaving(true)
    try {
      const features = featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const images = imagesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const updated = await updateProduct({
        data: {
          id: product.id,
          slug: product.slug,
          name,
          color,
          colorHex,
          price: parsedPrice,
          fabric,
          description,
          image,
          images: images.length > 0 ? images : image ? [image] : [],
          imageAlt,
          features,
          preOrder,
          active,
          sizes: sizes.map((size) => ({
            size,
            stock: Math.max(
              0,
              Number.parseInt(stockBySize[size] || '0', 10) || 0,
            ),
          })),
        },
      })
      toast.add({ type: 'success', title: 'Product saved' })
      if (updated.slug !== product.slug) {
        await router.navigate({
          to: '/dashboard/catalogue/$slug',
          params: { slug: updated.slug },
        })
      } else {
        await router.invalidate()
      }
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Could not save product',
        description: error instanceof Error ? error.message : 'Try again',
      })
    } finally {
      setSaving(false)
    }
  }

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

        <form
          className="max-w-2xl space-y-6 border border-border p-5 sm:p-6"
          onSubmit={onSubmit}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Product name</FieldLabel>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                required
                value={name}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="color">Color</FieldLabel>
                <Input
                  id="color"
                  onChange={(e) => setColor(e.target.value)}
                  required
                  value={color}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="colorHex">Color hex</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Color swatch"
                    className="size-9 shrink-0 border border-input bg-transparent"
                    onChange={(e) => setColorHex(e.target.value)}
                    type="color"
                    value={colorHex}
                  />
                  <Input
                    id="colorHex"
                    onChange={(e) => setColorHex(e.target.value)}
                    required
                    value={colorHex}
                  />
                </div>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="price">Price (IDR)</FieldLabel>
                <Input
                  id="price"
                  inputMode="numeric"
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  value={price}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fabric">Fabric</FieldLabel>
                <Input
                  id="fabric"
                  onChange={(e) => setFabric(e.target.value)}
                  required
                  value={fabric}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={preOrder}
                  onChange={(e) => setPreOrder(e.target.checked)}
                  type="checkbox"
                />
                Pre-order (Custom size on shop)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  type="checkbox"
                />
                Active on public shop
              </label>
            </div>

            <Field>
              <FieldLabel>Sizes</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {jerseySizeGuide.sizes.map((size) => (
                  <button
                    className={cn(
                      'min-w-12 border px-3 py-2 text-sm font-medium transition-colors',
                      sizes.includes(size)
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/40',
                    )}
                    key={size}
                    onClick={() => toggleSize(size)}
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </div>
              <FieldDescription>
                {preOrder
                  ? 'Custom measurements are offered on the public product page.'
                  : 'Only sizes with stock greater than zero sell on the public shop.'}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Stock per size</FieldLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {sizes.map((size) => (
                  <div key={size}>
                    <label
                      className="mb-1 block text-xs text-muted-foreground"
                      htmlFor={`stock-${size}`}
                    >
                      {size}
                    </label>
                    <Input
                      id={`stock-${size}`}
                      inputMode="numeric"
                      min={0}
                      onChange={(e) =>
                        setStockBySize((current) => ({
                          ...current,
                          [size]: e.target.value,
                        }))
                      }
                      type="number"
                      value={stockBySize[size] ?? '0'}
                    />
                  </div>
                ))}
              </div>
              {preOrder ? (
                <FieldDescription>
                  Stock is informational while pre-order is on.
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="image">Primary image URL</FieldLabel>
              <Input
                id="image"
                onChange={(e) => setImage(e.target.value)}
                required
                type="url"
                value={image}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="images">Gallery URLs (one per line)</FieldLabel>
              <textarea
                className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="images"
                onChange={(e) => setImagesText(e.target.value)}
                value={imagesText}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="imageAlt">Image alt text</FieldLabel>
              <Input
                id="imageAlt"
                onChange={(e) => setImageAlt(e.target.value)}
                required
                value={imageAlt}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                required
                value={description}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="features">Features (one per line)</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="features"
                onChange={(e) => setFeaturesText(e.target.value)}
                value={featuresText}
              />
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between gap-3">
            <img
              alt={imageAlt || product.imageAlt}
              className="size-16 object-cover bg-muted"
              decoding="async"
              height={64}
              src={shopImageSrc(image || product.image, 128)}
              width={64}
            />
            <Button disabled={saving} type="submit">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

import * as React from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProductImageFields, collectImageUrls, initialImageFields } from '~/components/product-image-fields'
import { jerseySizeGuide } from '~/data/shop'
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
import { Switch } from '~/components/ui/switch'
import { toast } from '~/components/ui/toast'
import { createProduct } from '~/lib/shop.functions'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/catalogue/new')({
  head: () => ({
    meta: seo({
      title: 'Add product · Dashboard | Barong Cycling Team',
      description: 'Add a new product to the Barong shop catalogue.',
    }),
  }),
  component: DashboardCreateProductPage,
})

function DashboardCreateProductPage() {
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [price, setPrice] = React.useState('850000')
  const [imageUrls, setImageUrls] = React.useState(() => initialImageFields([]))
  const [imageAlt, setImageAlt] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [featuresText, setFeaturesText] = React.useState('')
  const [preOrder, setPreOrder] = React.useState(true)
  const [membersOnly, setMembersOnly] = React.useState(false)
  const [active, setActive] = React.useState(true)
  const [stockBySize, setStockBySize] = React.useState<Record<string, string>>(
    () =>
      Object.fromEntries(jerseySizeGuide.sizes.map((size) => [size, '0'])),
  )
  const [saving, setSaving] = React.useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.add({ type: 'error', title: 'Enter a valid price' })
      return
    }

    setSaving(true)
    try {
      const features = featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const images = collectImageUrls(imageUrls)
      if (images.length === 0) {
        toast.add({ type: 'error', title: 'Add at least one feature image' })
        setSaving(false)
        return
      }
      const product = await createProduct({
        data: {
          name,
          price: parsedPrice,
          description,
          image: images[0],
          images,
          imageAlt,
          features,
          preOrder,
          membersOnly,
          active,
          sizes: jerseySizeGuide.sizes.map((size) => ({
            size,
            stock: Math.max(
              0,
              Number.parseInt(stockBySize[size] || '0', 10) || 0,
            ),
          })),
        },
      })
      toast.add({ type: 'success', title: 'Product created' })
      void navigate({
        to: '/dashboard/catalogue/$slug',
        params: { slug: product.slug },
      })
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Could not create product',
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
                <BreadcrumbPage>Add product</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Add product
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-order lets buyers pick any size. In stock needs a count per
            size — 0 means that size is not available.
          </p>
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
                placeholder="Classic Black"
                required
                value={name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="price">Price (IDR)</FieldLabel>
              <Input
                id="price"
                inputMode="numeric"
                onChange={(e) => setPrice(e.target.value)}
                placeholder="850000"
                required
                value={price}
              />
            </Field>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  aria-label={active ? 'Active' : 'Inactive'}
                  checked={active}
                  onCheckedChange={setActive}
                />
                <span className="text-sm">{active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  aria-label="Member only"
                  checked={membersOnly}
                  onCheckedChange={setMembersOnly}
                />
                <span className="text-sm">Member only</span>
              </div>
            </div>

            <Field>
              <FieldLabel>Availability</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <button
                  className={cn(
                    'border px-3 py-2 text-sm font-medium transition-colors',
                    preOrder
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/40',
                  )}
                  onClick={() => setPreOrder(true)}
                  type="button"
                >
                  Pre-order
                </button>
                <button
                  className={cn(
                    'border px-3 py-2 text-sm font-medium transition-colors',
                    !preOrder
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/40',
                  )}
                  onClick={() => setPreOrder(false)}
                  type="button"
                >
                  In stock
                </button>
              </div>
              <FieldDescription>
                {preOrder
                  ? 'Buyers can choose any size, including Custom.'
                  : 'Enter stock for each size. 0 means that size is not available.'}
              </FieldDescription>
            </Field>

            {!preOrder ? (
              <Field>
                <FieldLabel>Stock per size</FieldLabel>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {jerseySizeGuide.sizes.map((size) => (
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
              </Field>
            ) : null}

            <ProductImageFields onChange={setImageUrls} values={imageUrls} />

            <Field>
              <FieldLabel htmlFor="imageAlt">Image alt text</FieldLabel>
              <Input
                id="imageAlt"
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Black short-sleeve cycling jersey on a studio wall"
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
                placeholder="Cut, fabric, and when riders wear it."
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
                placeholder="Three rear pockets&#10;Full-length YKK zipper"
                value={featuresText}
              />
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between gap-3">
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              to="/dashboard/catalogue"
            >
              Cancel
            </Link>
            <Button disabled={saving} type="submit">
              {saving ? 'Saving…' : 'Add product'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

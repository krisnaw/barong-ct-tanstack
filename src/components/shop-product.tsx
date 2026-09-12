import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { CheckIcon } from '@phosphor-icons/react'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  CUSTOM_SIZE,
  customMeasurementsComplete,
  formatCustomMeasurements,
  formatShopPrice,
  jerseySizeGuide,
  productSizeOptions,
  shopImageSrc,
  type CustomMeasurements,
  type ShopProduct,
} from '~/data/shop'
import { useAccount } from '~/lib/account'
import { useCart } from '~/lib/cart'
import { cn } from '~/lib/utils'
import { toast } from '~/components/ui/toast'

type AccordionSection = 'information' | 'features' | 'size-guide' | null

const emptyCustom: CustomMeasurements = {
  chest: '',
  sleeve: '',
  frontZipper: '',
  back: '',
}

export function ShopProductDetail({ product }: { product: ShopProduct }) {
  const { addItem } = useCart()
  const { profile, signedIn } = useAccount()
  const [size, setSize] = React.useState('')
  const [custom, setCustom] = React.useState<CustomMeasurements>(emptyCustom)
  const [added, setAdded] = React.useState(false)
  const [activeImage, setActiveImage] = React.useState(0)
  const [openSection, setOpenSection] =
    React.useState<AccordionSection>('features')
  const gallery = product.images.length > 0 ? product.images : [product.image]
  const currentImage = gallery[activeImage] ?? product.image
  const sizeOptions = productSizeOptions(product)
  const isCustom = size === CUSTOM_SIZE
  const customReady = !isCustom || customMeasurementsComplete(custom)
  const canAdd = Boolean(size) && customReady && sizeOptions.includes(size)
  const savedSize =
    signedIn &&
    profile?.jerseySize &&
    sizeOptions.includes(profile.jerseySize)
      ? profile.jerseySize
      : ''

  function handleAdd() {
    if (!canAdd) return
    addItem(product.slug, size, 1, isCustom ? custom : undefined)
    setAdded(true)
    toast.add({
      type: 'success',
      title: 'Added to bag',
      description: isCustom
        ? `${product.name} · Custom (${formatCustomMeasurements(custom)})`
        : `${product.name} · Size ${size}`,
    })
  }

  React.useEffect(() => {
    setAdded(false)
    setActiveImage(0)
    setSize(savedSize)
    setCustom(emptyCustom)
    setOpenSection('features')
  }, [product.slug])

  React.useEffect(() => {
    if (!savedSize) return
    setSize((current) => current || savedSize)
  }, [savedSize])

  function setSection(section: Exclude<AccordionSection, null>, open: boolean) {
    setOpenSection((current) => {
      if (open) return section
      return current === section ? null : current
    })
  }

  function setCustomField(field: keyof CustomMeasurements, value: string) {
    setCustom((current) => ({ ...current, [field]: value }))
    setAdded(false)
  }

  return (
    <article>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-12 lg:py-12">
        <div className="max-w-md">
          <div className="relative overflow-hidden bg-muted">
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
            {product.preOrder ? (
              <span className="absolute top-3 left-3 bg-foreground px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.16em] text-background uppercase">
                Pre order
              </span>
            ) : null}
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Jersey
            </p>
            {product.preOrder ? (
              <span className="rounded-sm border border-border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] text-foreground uppercase">
                Pre order
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em]">
            {product.name}
          </h1>
          <p className="mt-2 font-heading text-xl font-medium tracking-tight tabular-nums">
            {formatShopPrice(product.price)}
          </p>
          {product.preOrder ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Made to order. Production starts after checkout closes.
            </p>
          ) : null}

          <fieldset className="mt-6">
            <legend className="text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
              Size
            </legend>
            {sizeOptions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Sold out — no sizes in stock right now.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {sizeOptions.map((option) => {
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
                        if (option !== CUSTOM_SIZE) setCustom(emptyCustom)
                      }}
                      type="button"
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            )}
            {product.preOrder ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Custom size available on pre-order with your measurements.
              </p>
            ) : null}
          </fieldset>

          {isCustom ? (
            <div className="mt-4 border border-border p-4">
              <p className="text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
                Custom measurements
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                All values in cm. Required for custom size.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <CustomField
                  id="custom-chest"
                  label="Chest"
                  onChange={(value) => setCustomField('chest', value)}
                  placeholder="115"
                  value={custom.chest}
                />
                <CustomField
                  id="custom-sleeve"
                  label="Sleeve"
                  onChange={(value) => setCustomField('sleeve', value)}
                  placeholder="40"
                  value={custom.sleeve}
                />
                <CustomField
                  id="custom-front-zipper"
                  label="Front zipper"
                  onChange={(value) => setCustomField('frontZipper', value)}
                  placeholder="58"
                  value={custom.frontZipper}
                />
                <CustomField
                  id="custom-back"
                  label="Back"
                  onChange={(value) => setCustomField('back', value)}
                  placeholder="66"
                  value={custom.back}
                />
              </div>
            </div>
          ) : null}

          <Button
            className="mt-6 w-full"
            disabled={!canAdd}
            onClick={handleAdd}
            size="lg"
            type="button"
          >
            {!size
              ? 'Select a size'
              : isCustom && !customReady
                ? 'Enter custom measurements'
                : isCustom
                  ? 'Add custom to bag'
                  : `Add ${size} to bag`}
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

          <ProductDetailsAccordion
            onSectionChange={setSection}
            openSection={openSection}
            product={product}
          />

          <Link
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'mt-4 w-full text-muted-foreground',
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

function CustomField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        value={value}
      />
    </div>
  )
}

function ProductDetailsAccordion({
  product,
  openSection,
  onSectionChange,
}: {
  product: ShopProduct
  openSection: AccordionSection
  onSectionChange: (
    section: Exclude<AccordionSection, null>,
    open: boolean,
  ) => void
}) {
  return (
    <div className="mt-8 border-t border-border">
      <AccordionItem
        onOpenChange={(open) => onSectionChange('information', open)}
        open={openSection === 'information'}
        title="Information"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
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
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Fabric</dt>
            <dd className="text-right font-medium">{product.fabric}</dd>
          </div>
          {product.preOrder ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Availability</dt>
              <dd className="font-medium">Pre order</dd>
            </div>
          ) : null}
        </dl>
      </AccordionItem>

      <AccordionItem
        onOpenChange={(open) => onSectionChange('features', open)}
        open={openSection === 'features'}
        title="Features"
      >
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          {product.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </AccordionItem>

      <AccordionItem
        onOpenChange={(open) => onSectionChange('size-guide', open)}
        open={openSection === 'size-guide'}
        title="Size guide"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Club jersey measurements. All values in {jerseySizeGuide.unit}.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3 text-left font-medium text-muted-foreground">
                  {jerseySizeGuide.unit}
                </th>
                {jerseySizeGuide.sizes.map((guideSize) => (
                  <th
                    className="px-2 py-2 text-center font-medium"
                    key={guideSize}
                    scope="col"
                  >
                    {guideSize}
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
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {jerseySizeGuide.note}
          {product.preOrder
            ? ' Need a non-standard fit? Choose Custom and enter chest, sleeve, front zipper, and back measurements.'
            : null}
        </p>
      </AccordionItem>
    </div>
  )
}

function AccordionItem({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Collapsible
      className="border-b border-border"
      onOpenChange={onOpenChange}
      open={open}
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-[0.7rem] font-medium tracking-[0.18em] uppercase outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <span>{title}</span>
        <span aria-hidden className="text-base leading-none font-normal">
          {open ? '×' : '+'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-5">{children}</CollapsibleContent>
    </Collapsible>
  )
}

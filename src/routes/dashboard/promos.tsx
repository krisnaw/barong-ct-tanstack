import * as React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { formatShopPrice } from '~/data/shop'
import {
  createShopPromo,
  listShopPromos,
  updateShopPromo,
  type ShopPromoRow,
} from '~/lib/shop.functions'
import { DashboardTableSkeleton } from '~/components/page-skeletons'
import { Spinner } from '~/components/ui/spinner'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { Switch } from '~/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { toast } from '~/components/ui/toast'
import { seo } from '~/utils/seo'

const discountTypeItems = [
  { value: 'fixed', label: 'Fixed (IDR)' },
  { value: 'percent', label: 'Percent (%)' },
] as const

type DiscountType = (typeof discountTypeItems)[number]['value']

export const Route = createFileRoute('/dashboard/promos')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: () => listShopPromos(),
  head: () => ({
    meta: seo({
      title: 'Promo codes · Dashboard | Barong Cycling Team',
      description: 'Shop promo codes for Barong Cycling Team orders.',
    }),
  }),
  component: DashboardPromosPage,
})

function DashboardPromosPage() {
  const promos = Route.useLoaderData()

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
                <BreadcrumbPage>Promo codes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Promo codes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {promos.length} {promos.length === 1 ? 'code' : 'codes'}
            </p>
          </div>
          <PromoFormDialog />
        </div>

        {promos.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No promo codes yet.
          </p>
        ) : (
          <div className="border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Code</TableHead>
                  <TableHead className="px-4">Discount</TableHead>
                  <TableHead className="px-4">Usage</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="px-4 py-3 font-medium">
                      <span className="inline-flex min-w-0 items-center gap-1">
                        {promo.code}
                        <CopyPromoButton code={promo.code} />
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">
                      {formatPromoDiscount(promo)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {promo.usedCount}
                      {promo.usageLimit != null ? ` / ${promo.usageLimit}` : ''}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      {promo.isActive ? 'Active' : 'Off'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <PromoFormDialog promo={promo} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}

function PromoFormDialog({ promo }: { promo?: ShopPromoRow }) {
  const router = useRouter()
  const mode = promo ? 'edit' : 'create'
  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [discountType, setDiscountType] = React.useState<DiscountType>('percent')
  const [discountValue, setDiscountValue] = React.useState('')
  const [usageLimit, setUsageLimit] = React.useState('')
  const [isActive, setIsActive] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (promo) {
      setCode(promo.code)
      setDiscountType(promo.discountType)
      setDiscountValue(String(promo.discountValue))
      setUsageLimit(promo.usageLimit != null ? String(promo.usageLimit) : '')
      setIsActive(promo.isActive)
      return
    }
    setCode('')
    setDiscountType('percent')
    setDiscountValue('')
    setUsageLimit('')
    setIsActive(true)
  }, [open, promo])

  async function save() {
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      toast.add({ type: 'error', title: 'Promo code is required' })
      return
    }

    const amount = Number(discountValue.replace(/\D/g, '') || 0)
    if (amount <= 0) {
      toast.add({ type: 'error', title: 'Discount must be greater than 0' })
      return
    }
    if (discountType === 'percent' && amount > 100) {
      toast.add({ type: 'error', title: 'Percent discount cannot exceed 100' })
      return
    }

    const limitRaw = usageLimit.replace(/\D/g, '')
    const payload = {
      code: trimmedCode,
      discountType,
      discountValue: amount,
      usageLimit: limitRaw ? Number(limitRaw) : null,
      isActive,
    }

    setSaving(true)
    try {
      if (promo) {
        await updateShopPromo({ data: { ...payload, id: promo.id } })
        toast.add({ type: 'success', title: 'Promo updated' })
      } else {
        await createShopPromo({ data: payload })
        toast.add({ type: 'success', title: 'Promo added' })
      }
      await router.invalidate()
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title: error instanceof Error ? error.message : 'Could not save promo',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
          />
        }
      >
        {mode === 'create' ? 'Add promo' : 'Edit'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add promo' : 'Edit promo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a promo code for shop orders.'
              : 'Update this promo code.'}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={`shop-promo-code-${promo?.id ?? 'new'}`}>
              Code
            </FieldLabel>
            <Input
              className="uppercase"
              id={`shop-promo-code-${promo?.id ?? 'new'}`}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="SAVE10"
              value={code}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`shop-promo-type-${promo?.id ?? 'new'}`}>
              Discount type
            </FieldLabel>
            <Select
              items={[...discountTypeItems]}
              onValueChange={(value) => {
                if (value == null) return
                setDiscountType(value as DiscountType)
              }}
              value={discountType}
            >
              <SelectTrigger
                className="w-full"
                id={`shop-promo-type-${promo?.id ?? 'new'}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {discountTypeItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`shop-promo-value-${promo?.id ?? 'new'}`}>
              Discount value
            </FieldLabel>
            <Input
              id={`shop-promo-value-${promo?.id ?? 'new'}`}
              inputMode="numeric"
              onChange={(event) => setDiscountValue(event.target.value)}
              placeholder={discountType === 'percent' ? '10' : '50000'}
              value={discountValue}
            />
            <FieldDescription>
              {discountType === 'percent'
                ? 'Percent off the order subtotal (1–100).'
                : 'Fixed IDR amount off the order subtotal.'}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`shop-promo-limit-${promo?.id ?? 'new'}`}>
              Usage limit
            </FieldLabel>
            <Input
              id={`shop-promo-limit-${promo?.id ?? 'new'}`}
              inputMode="numeric"
              onChange={(event) => setUsageLimit(event.target.value)}
              placeholder="Unlimited"
              value={usageLimit}
            />
            <FieldDescription>Leave empty for unlimited uses.</FieldDescription>
          </Field>
          <Field className="flex flex-row items-center justify-between gap-4">
            <div>
              <FieldLabel htmlFor={`shop-promo-active-${promo?.id ?? 'new'}`}>
                Active
              </FieldLabel>
              <FieldDescription>
                Inactive codes cannot be applied.
              </FieldDescription>
            </div>
            <Switch
              checked={isActive}
              id={`shop-promo-active-${promo?.id ?? 'new'}`}
              onCheckedChange={setIsActive}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={saving} onClick={() => void save()} type="button">
            {saving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : mode === 'create' ? (
              'Add promo'
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CopyPromoButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.add({ type: 'success', title: 'Promo code copied' })
    } catch {
      toast.add({ type: 'error', title: 'Could not copy promo code' })
    }
  }

  return (
    <Button
      aria-label={copied ? 'Promo code copied' : `Copy ${code}`}
      className="shrink-0 text-muted-foreground"
      onClick={() => void copy()}
      size="icon-xs"
      type="button"
      variant="ghost"
    >
      {copied ? <CheckIcon weight="bold" /> : <CopyIcon weight="bold" />}
    </Button>
  )
}

function formatPromoDiscount(promo: ShopPromoRow) {
  if (promo.discountType === 'percent') return `${promo.discountValue}%`
  return formatShopPrice(promo.discountValue)
}

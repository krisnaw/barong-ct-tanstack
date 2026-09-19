import * as React from 'react'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { formatIdr } from '~/data/events'
import {
  createEventPromo,
  getEventBySlug,
  listEventPromos,
  updateEventPromo,
  type EventPromoRow,
} from '~/lib/event.functions'
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
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

const discountTypeItems = [
  { value: 'fixed', label: 'Fixed (IDR)' },
  { value: 'percent', label: 'Percent (%)' },
] as const

type DiscountType = (typeof discountTypeItems)[number]['value']

export const Route = createFileRoute('/dashboard/events/$slug/promos')({
  loader: async ({ params }) => {
    const event = await getEventBySlug({
      data: { slug: params.slug, includeDraft: true },
    })
    if (!event) throw notFound()
    const promos = await listEventPromos({ data: { slug: params.slug } })
    return { event, promos }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `Promos · ${loaderData.event.name} · Dashboard | Barong Cycling Team`,
          description: `Promo codes for ${loaderData.event.name}.`,
        })
      : undefined,
  }),
  component: DashboardEventPromosPage,
})

function DashboardEventPromosPage() {
  const { event, promos } = Route.useLoaderData()

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
                <BreadcrumbLink render={<Link to="/dashboard/events" />}>
                  Events
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  render={
                    <Link
                      params={{ slug: event.slug }}
                      to="/dashboard/events/$slug"
                    />
                  }
                >
                  {event.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Promos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Manage promo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {promos.length} {promos.length === 1 ? 'promo' : 'promos'} ·{' '}
              {event.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PromoFormDialog eventSlug={event.slug} mode="create" />
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug"
            >
              Back to event
            </Link>
          </div>
        </div>

        {promos.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No promo codes yet for this event.
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
                      {promo.promo}
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">
                      {promo.discountType === 'percent'
                        ? `${promo.discountValue}%`
                        : formatIdr(promo.discountValue)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {promo.usedCount}
                      {promo.usageLimit != null ? ` / ${promo.usageLimit}` : ''}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      {promo.isActive ? 'Active' : 'Off'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <PromoFormDialog
                        eventSlug={event.slug}
                        mode="edit"
                        promo={promo}
                      />
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

function PromoFormDialog({
  mode,
  eventSlug,
  promo,
}: {
  mode: 'create' | 'edit'
  eventSlug: string
  promo?: EventPromoRow
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [discountType, setDiscountType] = React.useState<DiscountType>('fixed')
  const [discountValue, setDiscountValue] = React.useState('')
  const [usageLimit, setUsageLimit] = React.useState('')
  const [isActive, setIsActive] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (mode === 'edit' && promo) {
      setCode(promo.promo)
      setDiscountType(
        promo.discountType === 'percent' ? 'percent' : 'fixed',
      )
      setDiscountValue(String(promo.discountValue))
      setUsageLimit(promo.usageLimit != null ? String(promo.usageLimit) : '')
      setIsActive(promo.isActive)
      return
    }
    setCode('')
    setDiscountType('fixed')
    setDiscountValue('')
    setUsageLimit('')
    setIsActive(true)
  }, [open, mode, promo])

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
      slug: eventSlug,
      promo: trimmedCode,
      discountValue: amount,
      discountType,
      usageLimit: limitRaw ? Number(limitRaw) : null,
      isActive,
    }

    setSaving(true)
    try {
      if (mode === 'edit' && promo) {
        await updateEventPromo({ data: { ...payload, id: promo.id } })
        toast.add({ type: 'success', title: 'Promo updated' })
      } else {
        await createEventPromo({ data: payload })
        toast.add({ type: 'success', title: 'Promo created' })
      }
      await router.invalidate()
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error
            ? error.message
            : mode === 'edit'
              ? 'Could not update promo'
              : 'Could not create promo',
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
              ? 'Create a promo code for this event.'
              : 'Update promo details.'}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={`promo-code-${mode}-${promo?.id ?? 'new'}`}>
              Code
            </FieldLabel>
            <Input
              className="uppercase"
              id={`promo-code-${mode}-${promo?.id ?? 'new'}`}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SAVE10"
              required
              value={code}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`promo-type-${mode}-${promo?.id ?? 'new'}`}>
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
                id={`promo-type-${mode}-${promo?.id ?? 'new'}`}
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
            <FieldLabel htmlFor={`promo-value-${mode}-${promo?.id ?? 'new'}`}>
              Discount value
            </FieldLabel>
            <Input
              id={`promo-value-${mode}-${promo?.id ?? 'new'}`}
              inputMode="numeric"
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percent' ? '10' : '50000'}
              value={discountValue}
            />
            <FieldDescription>
              {discountType === 'percent'
                ? 'Percent off the entry price (1–100).'
                : 'Fixed IDR amount off the entry price.'}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`promo-limit-${mode}-${promo?.id ?? 'new'}`}>
              Usage limit
            </FieldLabel>
            <Input
              id={`promo-limit-${mode}-${promo?.id ?? 'new'}`}
              inputMode="numeric"
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
              value={usageLimit}
            />
            <FieldDescription>Leave empty for unlimited uses.</FieldDescription>
          </Field>
          <Field className="flex flex-row items-center justify-between gap-4">
            <div>
              <FieldLabel htmlFor={`promo-active-${mode}-${promo?.id ?? 'new'}`}>
                Active
              </FieldLabel>
              <FieldDescription>
                Inactive codes cannot be applied.
              </FieldDescription>
            </div>
            <Switch
              checked={isActive}
              id={`promo-active-${mode}-${promo?.id ?? 'new'}`}
              onCheckedChange={setIsActive}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={saving} onClick={() => void save()} type="button">
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

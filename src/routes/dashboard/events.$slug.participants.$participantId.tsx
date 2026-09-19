import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { formatIdr } from '~/data/events'
import { formatOrderDate } from '~/data/orders'
import {
  deleteEventParticipant,
  getEventParticipant,
} from '~/lib/event.functions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { toast } from '~/components/ui/toast'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'
import { DashboardDetailSkeleton } from '~/components/page-skeletons'

const participantStatusStyles: Record<string, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  pending_payment: 'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-800',
}

const participantStatusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

export const Route = createFileRoute(
  '/dashboard/events/$slug/participants/$participantId',
)({
  pendingComponent: DashboardDetailSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const participant = await getEventParticipant({
      data: {
        slug: params.slug,
        participantId: params.participantId,
      },
    })
    if (!participant) throw notFound()
    return { participant }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.participant.user.name} · ${loaderData.participant.event.name} · Dashboard | Barong Cycling Team`,
          description: `Participant detail for ${loaderData.participant.user.name}.`,
        })
      : undefined,
  }),
  component: DashboardParticipantDetailPage,
})

function DashboardParticipantDetailPage() {
  const { participant } = Route.useLoaderData()
  const { user, event, payment } = participant
  const isPaid = event.kind === 'paid' || event.kind === 'flagship'

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
                <BreadcrumbPage>{user.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ParticipantStatusBadge status={participant.status} />
            {participant.bibNumber ? (
              <span className="inline-flex items-center border border-border px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-[0.08em] text-muted-foreground">
                #{participant.bibNumber}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email}
            <span className="text-border"> · </span>
            Registered {formatOrderDate(participant.createdAt)}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DetailBlock title="Profile">
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="Gender" value={user.gender} />
              <InfoRow label="Blood type" value={user.bloodType} />
              <InfoRow label="Date of birth" value={user.dateOfBirth} />
              <InfoRow label="Nationality" value={user.nationality} />
              <InfoRow label="City" value={user.city} />
              <InfoRow label="Province" value={user.province} />
            </dl>
          </DetailBlock>

          <DetailBlock title="Emergency contact">
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="Name" value={user.emergencyContactName} />
              <InfoRow label="Phone" value={user.emergencyContactPhone} />
            </dl>
          </DetailBlock>

          <DetailBlock title="Registration">
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="Event" value={event.name} />
              <InfoRow label="Category" value={participant.categoryName} />
              <InfoRow label="Group" value={participant.groupName} />
              <InfoRow
                label="Jersey size"
                value={participant.jerseySize?.toUpperCase() ?? null}
              />
              <InfoRow
                label="Bib number"
                value={participant.bibNumber ?? 'Not assigned'}
              />
              <InfoRow
                label="Registered"
                value={formatOrderDate(participant.createdAt)}
              />
            </dl>
          </DetailBlock>

          {isPaid ? (
            <DetailBlock title="Pricing">
              <dl className="divide-y divide-border text-sm">
                <InfoRow label="Price" value={formatIdr(participant.price)} />
                <InfoRow
                  label="Service fee"
                  value={formatIdr(participant.serviceFee)}
                />
                {participant.promoCode ? (
                  <InfoRow
                    label={`Promo (${participant.promoCode})`}
                    value={`−${formatIdr(participant.discountAmount)}`}
                  />
                ) : null}
                <InfoRow
                  label="Total"
                  value={formatIdr(participant.finalPrice)}
                />
              </dl>
            </DetailBlock>
          ) : null}

          {payment ? (
            <DetailBlock title="Payment">
              <dl className="divide-y divide-border text-sm">
                <InfoRow label="Transaction" value={payment.transactionId} />
                <InfoRow label="Status" value={payment.status} />
                <InfoRow label="Method" value={payment.method} />
                <InfoRow label="Amount" value={formatIdr(payment.amount)} />
                <InfoRow
                  label="Paid at"
                  value={
                    payment.paidAt ? formatOrderDate(payment.paidAt) : null
                  }
                />
                {payment.checkoutUrl ? (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <dt className="shrink-0 text-muted-foreground">
                      Payment link
                    </dt>
                    <dd className="text-right">
                      <a
                        className="text-sm underline underline-offset-2"
                        href={payment.checkoutUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Open link
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </DetailBlock>
          ) : null}
        </div>

        <DeleteParticipantCard
          eventSlug={event.slug}
          participantId={participant.id}
          participantName={user.name}
        />
      </div>
    </>
  )
}

function DeleteParticipantCard({
  eventSlug,
  participantId,
  participantName,
}: {
  eventSlug: string
  participantId: string
  participantName: string
}) {
  const navigate = useNavigate()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteEventParticipant({
        data: { slug: eventSlug, participantId },
      })
      await router.invalidate()
      toast.add({ type: 'success', title: 'Participant deleted' })
      void navigate({
        to: '/dashboard/events/$slug',
        params: { slug: eventSlug },
      })
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error
            ? error.message
            : 'Could not delete participant',
      })
      setDeleting(false)
    }
  }

  return (
    <section className="border border-destructive/25 bg-destructive/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold tracking-tight text-destructive">
            Delete participant
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Permanently remove this registration and related payment records.
            This cannot be undone.
          </p>
        </div>
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger
            render={
              <Button className="shrink-0" type="button" variant="destructive" />
            }
          >
            Delete participant
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {participantName}?</DialogTitle>
              <DialogDescription>
                This permanently removes their registration for this event and
                any related payment records. You cannot recover it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                disabled={deleting}
                onClick={() => void confirmDelete()}
                type="button"
                variant="destructive"
              >
                {deleting ? (<><Spinner /> Deleting…</>) : 'Delete permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

function ParticipantStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
        participantStatusStyles[status] ??
          'border-zinc-200 bg-zinc-100 text-zinc-600',
      )}
    >
      {participantStatusLabel[status] ?? status.replaceAll('_', ' ')}
    </span>
  )
}

function DetailBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-border">
      <h2 className="border-b border-border px-4 py-3 font-heading text-sm font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right break-all">
        {value?.trim() ? value : '—'}
      </dd>
    </div>
  )
}

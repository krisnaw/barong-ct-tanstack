import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  formatOrderDate,
  orderItemCount,
  orderPaymentStatus,
} from '~/data/orders'
import { formatShopPrice } from '~/data/shop'
import { OrderStatusBadge } from '~/components/order-status-badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { listOrdersByUser } from '~/lib/order.functions'
import { getUserById, type AdminUserAddress } from '~/lib/user.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/users/$id')({
  loader: async ({ params }) => {
    const [account, orders] = await Promise.all([
      getUserById({ data: { id: params.id } }),
      listOrdersByUser({ data: { userId: params.id } }),
    ])
    if (!account) {
      throw notFound()
    }
    return { account, orders }
  },
  head: ({ loaderData, params }) => ({
    meta: seo({
      title: `${loaderData?.account.name ?? params.id} · Dashboard | Barong Cycling Team`,
      description: 'View a Barong Cycling Team user account.',
    }),
  }),
  component: DashboardUserDetailPage,
})

function DashboardUserDetailPage() {
  const { account, orders } = Route.useLoaderData()
  const initials = userInitials(account.name, account.email)

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
                <BreadcrumbLink render={<Link to="/dashboard/users" />}>
                  Users
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{account.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-heading text-sm font-semibold">
            {account.image ? (
              <img
                alt=""
                className="size-full object-cover"
                decoding="async"
                src={account.image}
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            {account.banned ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center border border-rose-200 bg-rose-50 px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] text-rose-800 uppercase">
                  Banned
                </span>
              </div>
            ) : null}
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {account.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {account.email}
              <span className="text-border"> · </span>
              Joined {formatOrderDate(account.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <UserBlock title="Profile">
              <dl className="divide-y divide-border text-sm">
                <InfoRow label="First name" value={account.profile.firstName} />
                <InfoRow label="Last name" value={account.profile.lastName} />
                <InfoRow label="Phone" value={account.profile.phone} />
                <InfoRow label="Gender" value={account.profile.gender} />
                <InfoRow label="Blood type" value={account.profile.bloodType} />
                <InfoRow
                  label="Date of birth"
                  value={account.profile.dateOfBirth}
                />
                <InfoRow
                  label="Nationality"
                  value={account.profile.nationality}
                />
                <InfoRow label="KTP or ID" value={account.profile.idNumber} />
                <InfoRow
                  label="Emergency contact"
                  value={
                    [
                      account.profile.emergencyContactName,
                      account.profile.emergencyContactPhone,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'
                  }
                />
                <InfoRow label="Kit size" value={account.profile.jerseySize} />
              </dl>
            </UserBlock>

            <UserBlock title="Shipping addresses">
              {account.shippingAddresses.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  No shipping address saved.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {account.shippingAddresses.map((address) => (
                    <li className="px-4 py-3 text-sm" key={address.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{address.label}</p>
                        {address.isDefault ? (
                          <span className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {formatAddress(address)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </UserBlock>
          </div>

          <UserBlock title="Account">
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="Role" value={account.role} />
              <InfoRow
                label="Email status"
                value={account.emailVerified ? 'Verified' : 'Unverified'}
              />
              <InfoRow
                label="Status"
                value={account.banned ? 'Banned' : 'Active'}
              />
              {account.banned && account.banReason ? (
                <InfoRow label="Ban reason" value={account.banReason} />
              ) : null}
              {account.banned && account.banExpires ? (
                <InfoRow
                  label="Ban expires"
                  value={formatOrderDate(account.banExpires)}
                />
              ) : null}
              <InfoRow
                label="Member since"
                value={formatOrderDate(account.createdAt)}
              />
              <InfoRow label="Orders" value={String(orders.length)} />
            </dl>
          </UserBlock>
        </div>

        <UserBlock title="Orders">
          {orders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Order</TableHead>
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4 text-right">Items</TableHead>
                  <TableHead className="px-4 text-right">Total</TableHead>
                  <TableHead className="px-4">Payment</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const count = orderItemCount(order)
                  return (
                    <TableRow className="relative" key={order.id}>
                      <TableCell className="px-4 py-3 font-medium">
                        <Link
                          className="after:absolute after:inset-0"
                          params={{ id: order.id }}
                          to="/dashboard/orders/$id"
                        >
                          {order.id}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {formatOrderDate(order.placedAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {count}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {formatShopPrice(order.total)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {orderPaymentStatus(order)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </UserBlock>
      </div>
    </>
  )
}

function UserBlock({
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right break-all">{value.trim() ? value : '—'}</dd>
    </div>
  )
}

function formatAddress(address: AdminUserAddress) {
  const line = [address.address, address.apartment].filter(Boolean).join(', ')
  const locality = [address.city, address.province, address.postal]
    .filter(Boolean)
    .join(', ')
  return [line, locality].filter(Boolean).join(' · ') || '—'
}

function userInitials(name: string, email: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length > 0) {
    return parts
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

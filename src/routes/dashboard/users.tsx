import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { auth } from '~/lib/auth'
import { seo } from '~/utils/seo'

const listUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const result = await auth.api.listUsers({
    query: {
      limit: 100,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    },
    headers,
  })

  return {
    total: result.total,
    users: result.users.map((row) => {
      const firstName =
        typeof row.firstName === 'string' ? row.firstName.trim() : ''
      const lastName =
        typeof row.lastName === 'string' ? row.lastName.trim() : ''
      const fromParts = `${firstName} ${lastName}`.trim()
      return {
        id: row.id,
        name: fromParts || row.name.trim() || row.email,
        email: row.email,
        role: row.role || 'user',
        banned: Boolean(row.banned),
        jerseySize:
          typeof row.jerseySize === 'string' && row.jerseySize
            ? row.jerseySize
            : 'M',
      }
    }),
  }
})

export const Route = createFileRoute('/dashboard/users')({
  loader: () => listUsers(),
  head: () => ({
    meta: seo({
      title: 'Users · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team users.',
    }),
  }),
  component: DashboardUsersPage,
})

function DashboardUsersPage() {
  const { users, total } = Route.useLoaderData()

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
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? 'person' : 'people'} · Registered accounts
          </p>
        </div>

        {users.length === 0 ? (
          <p className="border border-border px-4 py-10 text-sm text-muted-foreground">
            No users yet.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {users.map((account) => (
              <li
                className="flex items-center gap-4 px-4 py-3 text-sm"
                key={account.id}
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted font-heading text-xs font-semibold">
                  {accountInitials(account.name, account.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{account.name}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">
                    {account.email}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    {account.role}
                  </span>
                  {account.banned ? (
                    <span className="mt-1 block text-[0.65rem] font-medium tracking-[0.14em] text-destructive uppercase">
                      Banned
                    </span>
                  ) : (
                    <span className="mt-1 block text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
                      Kit {account.jerseySize}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function accountInitials(name: string, email: string) {
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

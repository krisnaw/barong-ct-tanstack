import { createFileRoute } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { seo } from '~/utils/seo'

const users = [
  {
    name: 'Barong Admin',
    email: 'admin@barong.ct',
    role: 'Admin',
  },
  {
    name: 'Gede Riza',
    email: 'gede@barong.ct',
    role: 'Marshal',
  },
  {
    name: 'Ayu Prameswari',
    email: 'ayu@example.com',
    role: 'Rider',
  },
  {
    name: 'Made Wirawan',
    email: 'made@barong.ct',
    role: 'Rider',
  },
]

export const Route = createFileRoute('/dashboard/users')({
  head: () => ({
    meta: seo({
      title: 'Users · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team users.',
    }),
  }),
  component: DashboardUsersPage,
})

function DashboardUsersPage() {
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
            {users.length} people · Admins, marshals, and riders
          </p>
        </div>

        <ul className="divide-y divide-border border border-border">
          {users.map((user) => (
            <li
              className="flex items-center gap-4 px-4 py-3 text-sm"
              key={user.email}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted font-heading text-xs font-semibold">
                {user.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="mt-0.5 truncate text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <span className="shrink-0 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {user.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

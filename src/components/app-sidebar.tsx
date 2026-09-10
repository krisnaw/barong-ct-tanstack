import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  CalendarBlankIcon,
  CommandIcon,
  PackageIcon,
  TShirtIcon,
  UsersIcon,
} from '@phosphor-icons/react'

import { NavMain } from '~/components/nav-main'
import { NavUser } from '~/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'

type SidebarUser = {
  name: string
  email: string
  image?: string | null
}

const data = {
  navMain: [
    {
      title: 'Events',
      url: '/dashboard/events',
      icon: <CalendarBlankIcon />,
    },
    {
      title: 'Catalogue',
      url: '/dashboard/catalogue',
      icon: <TShirtIcon />,
    },
    {
      title: 'Orders',
      url: '/dashboard/orders',
      icon: <PackageIcon />,
    },
    {
      title: 'Users',
      url: '/dashboard/users',
      icon: <UsersIcon />,
    },
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/dashboard/events" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <CommandIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Barong CT</span>
                <span className="truncate text-xs">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.image ?? '',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}

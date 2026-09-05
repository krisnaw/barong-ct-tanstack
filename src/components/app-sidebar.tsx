import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  CalendarBlankIcon,
  CommandIcon,
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

const data = {
  user: {
    name: 'Barong Admin',
    email: 'admin@barong.ct',
    avatar: '/favicon-32x32.png',
  },
  navMain: [
    {
      title: 'Events',
      url: '/dashboard',
      icon: <CalendarBlankIcon />,
    },
    {
      title: 'Users',
      url: '/dashboard',
      icon: <UsersIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
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
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

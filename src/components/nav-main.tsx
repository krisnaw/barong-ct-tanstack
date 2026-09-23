import { Link, useMatchRoute } from '@tanstack/react-router'
import { CaretRightIcon } from '@phosphor-icons/react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '~/components/ui/sidebar'

export type NavMainItem = {
  title: string
  url?: string
  icon?: React.ReactNode
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const matchRoute = useMatchRoute()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          if (item.items?.length) {
            const childActive = item.items.some((subItem) =>
              Boolean(matchRoute({ to: subItem.url, fuzzy: true })),
            )

            return (
              <Collapsible
                key={item.title}
                className="group/collapsible"
                defaultOpen={childActive}
                render={<SidebarMenuItem />}
              >
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      isActive={childActive}
                      tooltip={item.title}
                    />
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <CaretRightIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const isActive = Boolean(
                        matchRoute({ to: subItem.url, fuzzy: true }),
                      )
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={isActive}
                            render={<Link to={subItem.url} />}
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            )
          }

          if (!item.url) return null

          const isActive = Boolean(matchRoute({ to: item.url, fuzzy: true }))

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.title}
                render={<Link to={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

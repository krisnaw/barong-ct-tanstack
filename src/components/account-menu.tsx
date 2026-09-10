import { Link, useRouterState } from '@tanstack/react-router'
import {
  MapPinIcon,
  PackageIcon,
  SignInIcon,
  SignOutIcon,
  UserCircleIcon,
} from '@phosphor-icons/react'
import {
  accountDisplayName,
  accountInitials,
  useAccount,
} from '~/lib/account'
import { cn } from '~/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function AccountMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onAccount = pathname === '/account' || pathname.startsWith('/account/')
  const { profile, signedIn, ready, signOut } = useAccount()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          signedIn && profile
            ? `Account, ${accountDisplayName(profile)}`
            : 'Account'
        }
        className={cn(
          'inline-flex cursor-pointer text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:text-foreground',
          onAccount && 'text-foreground',
        )}
      >
        {ready && signedIn && profile ? (
          <span className="grid size-5 place-items-center rounded-full bg-foreground font-heading text-[0.55rem] font-semibold tracking-tight text-background">
            {accountInitials(profile)}
          </span>
        ) : (
          <UserCircleIcon
            aria-hidden
            className="size-5"
            weight={onAccount ? 'fill' : 'regular'}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 w-56" sideOffset={8}>
        {signedIn && profile ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-1.5 py-1.5 font-normal text-foreground">
                <span className="block truncate text-sm font-medium">
                  {accountDisplayName(profile)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {profile.email}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/account" />}>
              <UserCircleIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/account/address" />}>
              <MapPinIcon />
              Address
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/account/orders" />}>
              <PackageIcon />
              Orders
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} variant="destructive">
              <SignOutIcon />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-1.5 py-1.5 font-normal">
                <span className="block text-sm font-medium text-foreground">
                  Account
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Kit, orders, and delivery details.
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/account" />}>
              <SignInIcon />
              Sign in
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

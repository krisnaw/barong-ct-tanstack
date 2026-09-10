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
  const onAuth = pathname === '/auth/login' || pathname.startsWith('/auth/')
  const { profile, signedIn, ready, signOut } = useAccount()

  if (!ready || !signedIn || !profile) {
    return (
      <Link
        aria-label="Sign in"
        className={cn(
          'inline-flex items-center gap-1.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
          onAuth && 'font-medium text-foreground',
        )}
        to="/auth/login"
      >
        <SignInIcon aria-hidden className="size-5" weight={onAuth ? 'fill' : 'regular'} />
        <span className="text-sm">Sign</span>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account, ${accountDisplayName(profile)}`}
        className={cn(
          'inline-flex cursor-pointer text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:text-foreground',
          onAccount && 'text-foreground',
        )}
      >
        <span className="grid size-5 place-items-center rounded-full bg-foreground font-heading text-[0.55rem] font-semibold tracking-tight text-background">
          {accountInitials(profile)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 w-56" sideOffset={8}>
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

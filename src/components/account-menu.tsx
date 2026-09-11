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
import { useTranslations } from '~/lib/i18n'
import { cn } from '~/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
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
  const t = useTranslations()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onAccount = pathname === '/account' || pathname.startsWith('/account/')
  const onAuth = pathname === '/auth/login' || pathname.startsWith('/auth/')
  const { profile, signedIn, ready, signOut } = useAccount()

  if (!ready || !signedIn || !profile) {
    return (
      <Link
        aria-label={t.accountMenu.signIn}
        className={cn(
          'inline-flex items-center gap-1.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
          onAuth && 'font-medium text-foreground',
        )}
        to="/auth/login"
      >
        <SignInIcon
          aria-hidden
          className="size-5"
          weight={onAuth ? 'fill' : 'regular'}
        />
        <span className="text-sm">{t.accountMenu.sign}</span>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t.accountMenu.account}, ${accountDisplayName(profile)}`}
        className={cn(
          'inline-flex cursor-pointer text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:text-foreground',
          onAccount && 'text-foreground',
        )}
      >
        <span className="inline-flex">
          <Avatar className="size-8 after:rounded-full data-[size=default]:size-8">
            {profile.avatarUrl ? (
              <AvatarImage alt="" src={profile.avatarUrl} />
            ) : null}
            <AvatarFallback className="bg-foreground font-heading text-xs font-semibold tracking-tight text-background">
              {accountInitials(profile)}
            </AvatarFallback>
          </Avatar>
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
          {t.accountMenu.profile}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/account/address" />}>
          <MapPinIcon />
          {t.accountMenu.shippingAddress}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/account/orders" />}>
          <PackageIcon />
          {t.accountMenu.orders}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} variant="destructive">
          <SignOutIcon />
          {t.accountMenu.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

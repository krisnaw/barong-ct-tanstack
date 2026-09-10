import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import {
  getMyProfile,
  upsertMyProfile,
} from '~/lib/profile.functions'

export const ACCOUNT_PROVINCES = [
  'Bali',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Yogyakarta',
] as const

export type AccountProfile = {
  firstName: string
  lastName: string
  email: string
  phone: string
  jerseySize: string
  address: string
  apartment: string
  city: string
  province: string
  postal: string
}

type AccountContextValue = {
  profile: AccountProfile | null
  signedIn: boolean
  ready: boolean
  signOut: () => void
  updateProfile: (patch: Partial<AccountProfile>) => Promise<void>
}

const AccountContext = React.createContext<AccountContextValue | null>(null)

function emptyProfile(email = ''): AccountProfile {
  return {
    firstName: '',
    lastName: '',
    email,
    phone: '',
    jerseySize: 'M',
    address: '',
    apartment: '',
    city: '',
    province: 'Bali',
    postal: '',
  }
}

export function accountDisplayName(profile: AccountProfile) {
  const name = `${profile.firstName} ${profile.lastName}`.trim()
  return name || profile.email
}

export function accountInitials(profile: AccountProfile) {
  const parts = [profile.firstName, profile.lastName].filter(Boolean)
  if (parts.length > 0) {
    return parts
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return profile.email.slice(0, 2).toUpperCase()
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [profile, setProfile] = React.useState<AccountProfile | null>(null)
  const [profileReady, setProfileReady] = React.useState(false)
  const user = session?.user
  const userId = user?.id

  React.useEffect(() => {
    let cancelled = false

    if (!userId) {
      setProfile(null)
      setProfileReady(!isPending)
      return
    }

    setProfileReady(false)
    void getMyProfile()
      .then((row) => {
        if (cancelled) return
        setProfile({
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          jerseySize: row.jerseySize,
          address: row.address,
          apartment: row.apartment,
          city: row.city,
          province: row.province,
          postal: row.postal,
        })
        setProfileReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setProfile(emptyProfile(user?.email ?? ''))
        setProfileReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [userId, user?.email, isPending])

  const signOut = React.useCallback(() => {
    void authClient.signOut().then(() => {
      setProfile(null)
      void navigate({ to: '/' })
    })
  }, [navigate])

  const updateProfile = React.useCallback(
    async (patch: Partial<AccountProfile>) => {
      if (!user) return
      const next = await upsertMyProfile({ data: patch })
      setProfile({
        firstName: next.firstName,
        lastName: next.lastName,
        email: next.email,
        phone: next.phone,
        jerseySize: next.jerseySize,
        address: next.address,
        apartment: next.apartment,
        city: next.city,
        province: next.province,
        postal: next.postal,
      })
      await authClient.getSession()
    },
    [user],
  )

  const value = React.useMemo(
    () => ({
      profile,
      signedIn: Boolean(user),
      ready: !isPending && profileReady,
      signOut,
      updateProfile,
    }),
    [profile, user, isPending, profileReady, signOut, updateProfile],
  )

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}

export function useAccount() {
  const ctx = React.useContext(AccountContext)
  if (!ctx) {
    throw new Error('useAccount must be used within AccountProvider')
  }
  return ctx
}

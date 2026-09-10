import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'

const ADDRESS_STORAGE_KEY = 'barong-shop-account-address'

export const ACCOUNT_PROVINCES = [
  'Bali',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Yogyakarta',
] as const

type AddressFields = {
  address: string
  apartment: string
  city: string
  province: string
  postal: string
}

export type AccountProfile = {
  firstName: string
  lastName: string
  email: string
  phone: string
  jerseySize: string
} & AddressFields

type AuthUser = {
  id: string
  name: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  jerseySize?: string | null
}

type AccountContextValue = {
  profile: AccountProfile | null
  signedIn: boolean
  ready: boolean
  signOut: () => void
  updateProfile: (patch: Partial<AccountProfile>) => Promise<void>
}

const AccountContext = React.createContext<AccountContextValue | null>(null)

const ADDRESS_KEYS = [
  'address',
  'apartment',
  'city',
  'province',
  'postal',
] as const

function emptyAddress(): AddressFields {
  return {
    address: '',
    apartment: '',
    city: '',
    province: 'Bali',
    postal: '',
  }
}

function splitName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return { firstName: firstName ?? '', lastName: rest.join(' ') }
}

function readAddress(userId: string): AddressFields {
  if (typeof window === 'undefined') return emptyAddress()
  try {
    const raw = window.localStorage.getItem(ADDRESS_STORAGE_KEY)
    if (!raw) return emptyAddress()
    const parsed = JSON.parse(raw) as Record<string, Partial<AddressFields>>
    const stored = parsed[userId]
    if (!stored || typeof stored !== 'object') return emptyAddress()
    return { ...emptyAddress(), ...stored }
  } catch {
    return emptyAddress()
  }
}

function writeAddress(userId: string, address: AddressFields) {
  try {
    const raw = window.localStorage.getItem(ADDRESS_STORAGE_KEY)
    const all = raw
      ? (JSON.parse(raw) as Record<string, AddressFields>)
      : {}
    all[userId] = address
    window.localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function profileFromUser(user: AuthUser, address: AddressFields): AccountProfile {
  const split = splitName(user.name)
  return {
    firstName: user.firstName?.trim() || split.firstName,
    lastName: user.lastName?.trim() || split.lastName,
    email: user.email,
    phone: user.phone ?? '',
    jerseySize: user.jerseySize || 'M',
    ...address,
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
  const [address, setAddress] = React.useState<AddressFields>(emptyAddress)
  const user = session?.user
  const userId = user?.id

  React.useEffect(() => {
    if (!userId) {
      setAddress(emptyAddress())
      return
    }
    setAddress(readAddress(userId))
  }, [userId])

  const profile = user ? profileFromUser(user, address) : null

  const signOut = React.useCallback(() => {
    void authClient.signOut().then(() => {
      void navigate({ to: '/' })
    })
  }, [navigate])

  const updateProfile = React.useCallback(
    async (patch: Partial<AccountProfile>) => {
      if (!user) return

      const addressPatch: Partial<AddressFields> = {}
      let hasAddress = false
      for (const key of ADDRESS_KEYS) {
        if (patch[key] !== undefined) {
          addressPatch[key] = patch[key]
          hasAddress = true
        }
      }
      if (hasAddress) {
        const next = { ...address, ...addressPatch }
        setAddress(next)
        writeAddress(user.id, next)
      }

      const firstName =
        patch.firstName !== undefined
          ? patch.firstName.trim()
          : (user.firstName?.trim() || splitName(user.name).firstName)
      const lastName =
        patch.lastName !== undefined
          ? patch.lastName.trim()
          : (user.lastName?.trim() || splitName(user.name).lastName)
      const userPatch: {
        firstName?: string
        lastName?: string
        phone?: string
        jerseySize?: string
        name?: string
      } = {}

      if (patch.firstName !== undefined) userPatch.firstName = firstName
      if (patch.lastName !== undefined) userPatch.lastName = lastName
      if (patch.phone !== undefined) userPatch.phone = patch.phone.trim()
      if (patch.jerseySize !== undefined) userPatch.jerseySize = patch.jerseySize

      if (Object.keys(userPatch).length === 0) return

      userPatch.name = `${firstName} ${lastName}`.trim() || user.name
      const { error } = await authClient.updateUser(userPatch)
      if (error) {
        throw new Error(error.message || 'Could not save profile')
      }
    },
    [user, address],
  )

  const value = React.useMemo(
    () => ({
      profile,
      signedIn: Boolean(user),
      ready: !isPending,
      signOut,
      updateProfile,
    }),
    [profile, user, isPending, signOut, updateProfile],
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

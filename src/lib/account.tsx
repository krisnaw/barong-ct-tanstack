import * as React from 'react'
import { shopOrders, type ShopOrder } from '~/data/orders'
import { resolveShopOrders } from '~/lib/orders'

const STORAGE_KEY = 'barong-shop-account'

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

type StoredState = {
  sessionEmail: string | null
  profiles: Record<string, AccountProfile>
}

type AccountContextValue = {
  profile: AccountProfile | null
  signedIn: boolean
  ready: boolean
  signIn: (email: string) => void
  signOut: () => void
  updateProfile: (patch: Partial<AccountProfile>) => void
}

const AccountContext = React.createContext<AccountContextValue | null>(null)

function emptyState(): StoredState {
  return { sessionEmail: null, profiles: {} }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isProfile(value: unknown): value is AccountProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as AccountProfile
  return typeof profile.email === 'string'
}

function emptyProfile(email: string): AccountProfile {
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

function profileFromOrder(order: ShopOrder): AccountProfile {
  return {
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    phone: order.phone,
    jerseySize: order.lines[0]?.size ?? 'M',
    address: order.address,
    apartment: '',
    city: order.city,
    province: order.province || 'Bali',
    postal: order.postal,
  }
}

function hydrateProfile(email: string, existing?: AccountProfile) {
  if (existing && (existing.firstName || existing.phone || existing.address)) {
    return { ...existing, email }
  }
  const match = [...resolveShopOrders(), ...shopOrders].find(
    (order) => normalizeEmail(order.email) === normalizeEmail(email),
  )
  if (match) return profileFromOrder(match)
  return existing ? { ...existing, email } : emptyProfile(email)
}

function readState(): StoredState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<StoredState>
    const profiles: Record<string, AccountProfile> = {}
    if (parsed.profiles && typeof parsed.profiles === 'object') {
      for (const [key, value] of Object.entries(parsed.profiles)) {
        if (isProfile(value)) profiles[normalizeEmail(key)] = value
      }
    }
    const sessionEmail =
      typeof parsed.sessionEmail === 'string'
        ? normalizeEmail(parsed.sessionEmail)
        : null
    return { sessionEmail, profiles }
  } catch {
    return emptyState()
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
  const [state, setState] = React.useState<StoredState>(emptyState)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setState(readState())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [ready, state])

  const signIn = React.useCallback((email: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized.includes('@')) return
    setState((current) => {
      const profile = hydrateProfile(email.trim(), current.profiles[normalized])
      return {
        sessionEmail: normalized,
        profiles: { ...current.profiles, [normalized]: profile },
      }
    })
  }, [])

  const signOut = React.useCallback(() => {
    setState((current) => ({ ...current, sessionEmail: null }))
  }, [])

  const updateProfile = React.useCallback((patch: Partial<AccountProfile>) => {
    setState((current) => {
      if (!current.sessionEmail) return current
      const previous = current.profiles[current.sessionEmail]
      if (!previous) return current
      const next = { ...previous, ...patch }
      const nextEmail = normalizeEmail(next.email)
      if (!nextEmail.includes('@')) return current
      const profiles = { ...current.profiles }
      if (nextEmail !== current.sessionEmail) {
        delete profiles[current.sessionEmail]
      }
      profiles[nextEmail] = { ...next, email: next.email.trim() }
      return { sessionEmail: nextEmail, profiles }
    })
  }, [])

  const sessionEmail = state.sessionEmail
  const profile = sessionEmail ? (state.profiles[sessionEmail] ?? null) : null

  const value = React.useMemo(
    () => ({
      profile,
      signedIn: Boolean(profile),
      ready,
      signIn,
      signOut,
      updateProfile,
    }),
    [profile, ready, signIn, signOut, updateProfile],
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

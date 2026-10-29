import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import {
  getMyProfile,
  upsertMyProfile,
} from '~/lib/profile.functions'
import { type ShippingAddressRow } from '~/lib/shipping-address.functions'

export type AccountShippingAddress = ShippingAddressRow

export const ACCOUNT_PROVINCES = [
  'Bali',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Yogyakarta',
] as const

export const ACCOUNT_GENDERS = ['Male', 'Female'] as const

export const ACCOUNT_BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const

export type AccountProfile = {
  avatarUrl: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  bloodType: string
  dateOfBirth: string
  nationality: string
  idNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
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
    avatarUrl: '',
    firstName: '',
    lastName: '',
    email,
    phone: '',
    gender: '',
    bloodType: '',
    dateOfBirth: '',
    nationality: '',
    idNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
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
  const loadedFor = React.useRef<string | null>(null)
  const user = session?.user
  const userId = user?.id

  React.useEffect(() => {
    let cancelled = false

    if (!userId) {
      loadedFor.current = null
      setProfile(null)
      setProfileReady(!isPending)
      return
    }

    if (loadedFor.current !== userId) setProfileReady(false)
    void getMyProfile()
      .then((row) => {
        if (cancelled) return
        setProfile({
          ...emptyProfile(row.email),
          avatarUrl: row.avatarUrl,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          gender: row.gender,
          bloodType: row.bloodType,
          dateOfBirth: row.dateOfBirth,
          nationality: row.nationality,
          idNumber: row.idNumber,
          emergencyContactName: row.emergencyContactName,
          emergencyContactPhone: row.emergencyContactPhone,
          jerseySize: row.jerseySize,
          address: row.address,
          apartment: row.apartment,
          city: row.city,
          province: row.province,
          postal: row.postal,
        })
        loadedFor.current = userId
        setProfileReady(true)
      })
      .catch(() => {
        if (cancelled) return
        loadedFor.current = userId
        setProfile({
          ...emptyProfile(user?.email ?? ''),
          avatarUrl: user?.image ?? '',
        })
        setProfileReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [userId, user?.name, user?.email, user?.image, isPending])

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
      setProfile((prev) => ({
        ...emptyProfile(next.email),
        ...prev,
        firstName: next.firstName,
        lastName: next.lastName,
        email: next.email,
        phone: next.phone,
        gender: next.gender,
        bloodType: next.bloodType,
        dateOfBirth: next.dateOfBirth,
        nationality: next.nationality,
        idNumber: next.idNumber,
        emergencyContactName: next.emergencyContactName,
        emergencyContactPhone: next.emergencyContactPhone,
        jerseySize: next.jerseySize,
        address: next.address,
        apartment: next.apartment,
        city: next.city,
        province: next.province,
        postal: next.postal,
        avatarUrl: prev?.avatarUrl ?? user.image ?? '',
      }))
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

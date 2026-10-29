import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AccountProfilePanel } from '~/components/account/profile-form'
import { toast } from '~/components/ui/toast'
import { authClient } from '~/lib/auth-client'
import { removeAvatar, uploadAvatar } from '~/lib/avatar.functions'
import type { AccountProfile } from '~/lib/account'
import { getMyProfile, upsertMyProfile } from '~/lib/profile.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/')({
  loader: () => getMyProfile(),
  head: () => ({
    meta: seo({
      title: 'Profile | Account | Barong Cycling Team',
      description: 'Update your Barong profile, event address, and club kit size.',
    }),
  }),
  component: AccountProfilePage,
})

function profileFields(profile: AccountProfile) {
  const { avatarUrl: _avatarUrl, email: _email, ...fields } = profile
  return fields
}

function AccountProfilePage() {
  const row = Route.useLoaderData()
  const router = useRouter()
  const profile: AccountProfile = {
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
  }

  async function refresh() {
    await authClient.getSession()
    await router.invalidate()
  }

  return (
    <AccountProfilePanel
      key={JSON.stringify(profileFields(profile))}
      onClearAvatar={async () => {
        await removeAvatar()
        await refresh()
      }}
      onSave={async (draft) => {
        await upsertMyProfile({ data: profileFields(draft) })
        toast.add({
          type: 'success',
          title: 'Profile saved',
        })
        await refresh()
      }}
      onUploadAvatar={async (file) => {
        const data = await readFileAsBase64(file)
        await uploadAvatar({
          data: {
            contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
            data,
          },
        })
        await refresh()
      }}
      profile={profile}
    />
  )
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Could not read image'))
        return
      }
      resolve(result)
    }
    reader.readAsDataURL(file)
  })
}

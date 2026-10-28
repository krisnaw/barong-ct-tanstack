import { createFileRoute } from '@tanstack/react-router'
import { AccountProfilePanel } from '~/components/account/profile-form'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/account/')({
  head: () => ({
    meta: seo({
      title: 'Profile | Account | Barong Cycling Team',
      description: 'Update your Barong profile, event address, and club kit size.',
    }),
  }),
  component: AccountProfilePage,
})

function AccountProfilePage() {
  return <AccountProfilePanel />
}

import { adminClient, magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { ac, authRoles } from '~/lib/auth-permissions'

export const PASSWORD_AUTH_ENABLED = false

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: authRoles,
    }),
    magicLinkClient(),
  ],
})

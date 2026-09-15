import { adminClient, magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const PASSWORD_AUTH_ENABLED = false

export const authClient = createAuthClient({
  plugins: [adminClient(), magicLinkClient()],
})

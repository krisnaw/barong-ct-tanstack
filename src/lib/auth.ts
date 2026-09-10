import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { waitUntil } from 'cloudflare:workers'
import { db } from '~/lib/db'
import * as schema from '~/lib/auth-schema'
import { sendVerificationEmail } from '~/lib/email'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      waitUntil(
        sendVerificationEmail({
          to: user.email,
          name: user.name || 'Rider',
          url,
        }),
      )
    },
  },
  trustedOrigins: [
    'http://localhost:*',
    'https://localhost:*',
    'https://staging.barongcycling.com',
    'https://barongcycling.com',
  ],
  plugins: [admin(), tanstackStartCookies()],
})

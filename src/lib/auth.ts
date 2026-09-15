import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { admin, magicLink } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { waitUntil } from 'cloudflare:workers'
import { db } from '~/lib/db'
import * as schema from '~/lib/auth-schema'
import {
  sendMagicLinkEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '~/lib/email'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      waitUntil(
        sendResetPasswordEmail({
          to: user.email,
          name: user.name || 'Rider',
          url,
        }),
      )
    },
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
  plugins: [
    admin(),
    magicLink({
      expiresIn: 60 * 15,
      storeToken: 'hashed',
      sendMagicLink: async ({ email, url, metadata }) => {
        const name =
          typeof metadata?.name === 'string' && metadata.name.trim()
            ? metadata.name.trim()
            : 'Rider'
        await sendMagicLinkEmail({
          to: email,
          name,
          url,
        })
      },
    }),
    tanstackStartCookies(),
  ],
})

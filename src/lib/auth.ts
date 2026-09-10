import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '~/lib/db'
import * as schema from '~/lib/auth-schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ['http://localhost:*', 'https://localhost:*'],
  plugins: [admin(), tanstackStartCookies()],
})

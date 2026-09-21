import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as authSchema from '~/lib/auth-schema'
import * as eventSchema from '~/lib/event-schema'
import * as orderSchema from '~/lib/order-schema'
import * as shopSchema from '~/lib/shop-schema'

export const db = drizzle(env.DB, {
  schema: { ...authSchema, ...shopSchema, ...orderSchema, ...eventSchema },
})

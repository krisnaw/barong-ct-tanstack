import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

/**
 * Better Auth roles. Staff permissions are intentionally empty until policy is defined.
 */
const statement = {
  ...defaultStatements,
} as const

export const ac = createAccessControl(statement)

export const user = ac.newRole({})

export const staff = ac.newRole({})

export const admin = ac.newRole({
  ...adminAc.statements,
})

export const authRoles = {
  user,
  staff,
  admin,
} as const

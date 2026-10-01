import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

const STAGING_HOST = 'staging.barongmelali.com'

export const getIsStaging = createServerFn({ method: 'GET' }).handler(
  async () => {
    const host = getRequestHeaders().get('host') ?? ''
    return host.split(':')[0] === STAGING_HOST
  },
)

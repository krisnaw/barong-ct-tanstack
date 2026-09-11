import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/api/avatars/$userId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const userId = params.userId
        if (!userId || userId.includes('/') || userId.includes('..')) {
          return new Response('Not found', { status: 404 })
        }

        const object = await env.AVATARS.get(`avatars/${userId}`)
        if (!object) {
          return new Response('Not found', { status: 404 })
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('cache-control', 'public, max-age=31536000, immutable')

        return new Response(object.body, { headers })
      },
    },
  },
})

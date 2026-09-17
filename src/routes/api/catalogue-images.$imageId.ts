import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { catalogueObjectKey } from '~/lib/catalogue-image'

const IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const Route = createFileRoute('/api/catalogue-images/$imageId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const imageId = params.imageId
        if (!imageId || !IMAGE_ID.test(imageId)) {
          return new Response('Not found', { status: 404 })
        }

        const object = await env.AVATARS.get(catalogueObjectKey(imageId))
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

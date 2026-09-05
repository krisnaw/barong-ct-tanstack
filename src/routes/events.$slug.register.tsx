import * as React from 'react'
import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from '@tanstack/react-router'
import { z } from 'zod'
import {
  EventRegisterWizard,
  type RegisterStep,
} from '~/components/event-register-wizard'
import { seo } from '~/utils/seo'

const registerSearchSchema = z.object({
  step: z
    .enum(['jersey', 'route', 'profile', 'payment', 'done'])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/events/$slug/register')({
  validateSearch: registerSearchSchema,
  head: () => ({
    meta: seo({
      title: 'Register | Barong Cycling Team',
      description: 'Complete your event registration.',
    }),
  }),
  component: EventRegisterPage,
})

function EventRegisterPage() {
  const event = useLoaderData({ from: '/events/$slug' })
  const { step: requestedStep } = Route.useSearch()
  const navigate = useNavigate()
  const params = Route.useParams()

  const defaultStep: RegisterStep =
    event.registration === 'full' ? 'jersey' : 'profile'
  const allowed: RegisterStep[] =
    event.registration === 'full'
      ? ['jersey', 'route', 'profile', 'payment']
      : ['profile', 'done']
  const step =
    requestedStep && allowed.includes(requestedStep)
      ? requestedStep
      : defaultStep

  React.useEffect(() => {
    if (event.status !== 'open') {
      void navigate({
        to: '/events/$slug',
        params: { slug: params.slug },
        replace: true,
      })
      return
    }
    if (requestedStep === step) return
    void navigate({
      to: '/events/$slug/register',
      params: { slug: params.slug },
      search: { step },
      replace: true,
    })
  }, [event.status, navigate, params.slug, requestedStep, step])

  if (event.status !== 'open') {
    return null
  }

  return <EventRegisterWizard event={event} step={step} />
}

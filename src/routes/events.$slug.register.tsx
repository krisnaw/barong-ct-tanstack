import * as React from 'react'
import {
  createFileRoute,
  redirect,
  useLoaderData,
  useNavigate,
} from '@tanstack/react-router'
import { z } from 'zod'
import { EventRegisterWizard } from '~/components/event-register-wizard'
import {
  firstStepForKind,
  type RegisterStep,
  stepsForKind,
} from '~/data/events'
import { getSession } from '~/lib/auth.functions'
import { getMyProfile } from '~/lib/profile.functions'
import { seo } from '~/utils/seo'

const registerSteps = [
  'group',
  'course',
  'jersey',
  'profile',
  'payment',
  'done',
] as const

const registerSearchSchema = z.object({
  step: z.enum(registerSteps).optional().catch(undefined),
  groupId: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/events/$slug/register')({
  validateSearch: registerSearchSchema,
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: '/auth/login',
        search: {
          redirect: `${location.pathname}${location.searchStr}`,
        },
      })
    }
  },
  loader: () => getMyProfile(),
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
  const profile = Route.useLoaderData()
  const { step: requestedStep, groupId } = Route.useSearch()
  const navigate = useNavigate()
  const params = Route.useParams()

  const allowed = stepsForKind(event.kind)
  const defaultStep: RegisterStep =
    event.kind === 'flagship' && groupId
      ? 'course'
      : firstStepForKind(event.kind)
  const step: RegisterStep =
    requestedStep === 'done'
      ? 'done'
      : requestedStep && allowed.includes(requestedStep)
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
      search: { step, groupId },
      replace: true,
    })
  }, [event.status, groupId, navigate, params.slug, requestedStep, step])

  if (event.status !== 'open') {
    return null
  }

  return (
    <EventRegisterWizard
      event={event}
      groupId={groupId}
      profile={profile}
      step={step}
    />
  )
}

import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { PickupPointForm } from '~/components/pickup-point-form'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { toast } from '~/components/ui/toast'
import {
  getPickupPoint,
  updatePickupPoint,
} from '~/lib/pickup-point.functions'
import { seo } from '~/utils/seo'
import { DashboardFormSkeleton } from '~/components/page-skeletons'

export const Route = createFileRoute('/dashboard/pickup-points/$id')({
  pendingComponent: DashboardFormSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const point = await getPickupPoint({ data: { id: params.id } })
    if (!point) {
      throw notFound()
    }
    return { point }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.point.name} · Dashboard | Barong Cycling Team`,
          description: `Edit pickup point ${loaderData.point.name}.`,
        })
      : undefined,
  }),
  component: DashboardPickupPointDetailPage,
})

function DashboardPickupPointDetailPage() {
  const { point } = Route.useLoaderData()
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/dashboard/pickup-points" />}>
                  Pickup Points
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{point.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {point.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update this pickup location. Inactive points stay hidden from
            checkout later.
          </p>
        </div>

        <PickupPointForm
          onSubmit={async (values) => {
            setSaving(true)
            try {
              await updatePickupPoint({
                data: { id: point.id, ...values },
              })
              toast.add({ type: 'success', title: 'Pickup point saved' })
              await router.invalidate()
            } catch (error) {
              toast.add({
                type: 'error',
                title: 'Could not save pickup point',
                description:
                  error instanceof Error ? error.message : 'Try again',
              })
            } finally {
              setSaving(false)
            }
          }}
          point={point}
          saving={saving}
          submitLabel="Save changes"
        />
      </div>
    </>
  )
}

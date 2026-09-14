import * as React from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
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
import { createPickupPoint } from '~/lib/pickup-point.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/pickup-points/new')({
  head: () => ({
    meta: seo({
      title: 'Add pickup point · Dashboard | Barong Cycling Team',
      description: 'Add a shop pickup location for Barong kit collection.',
    }),
  }),
  component: DashboardCreatePickupPointPage,
})

function DashboardCreatePickupPointPage() {
  const navigate = useNavigate()
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
                <BreadcrumbPage>Add pickup point</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Add pickup point
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A location where riders can collect kit instead of shipping.
          </p>
        </div>

        <PickupPointForm
          onSubmit={async (values) => {
            setSaving(true)
            try {
              const created = await createPickupPoint({ data: values })
              toast.add({ type: 'success', title: 'Pickup point created' })
              void navigate({
                to: '/dashboard/pickup-points/$id',
                params: { id: created.id },
              })
            } catch (error) {
              toast.add({
                type: 'error',
                title: 'Could not create pickup point',
                description:
                  error instanceof Error ? error.message : 'Try again',
              })
            } finally {
              setSaving(false)
            }
          }}
          saving={saving}
          submitLabel="Add pickup point"
        />
      </div>
    </>
  )
}

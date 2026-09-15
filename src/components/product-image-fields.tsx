import * as React from 'react'
import { PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'

export type ImageUrlField = {
  id: string
  url: string
}

function newImageField(url = ''): ImageUrlField {
  return { id: crypto.randomUUID(), url }
}

export function collectImageUrls(fields: ImageUrlField[]) {
  return fields.map((field) => field.url.trim()).filter(Boolean)
}

export function initialImageFields(urls: string[], min = 2): ImageUrlField[] {
  const next = urls.map((url) => url.trim()).filter(Boolean).map(newImageField)
  while (next.length < min) next.push(newImageField())
  return next
}

export function ProductImageUrlFields({
  values,
  onChange,
}: {
  values: ImageUrlField[]
  onChange: (next: ImageUrlField[]) => void
}) {
  const id = React.useId()

  function setAt(fieldId: string, url: string) {
    onChange(
      values.map((field) => (field.id === fieldId ? { ...field, url } : field)),
    )
  }

  function removeAt(fieldId: string) {
    const next = values.filter((field) => field.id !== fieldId)
    onChange(next.length > 0 ? next : [newImageField()])
  }

  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={`${id}-${values[0]?.id ?? '0'}`}>
          Feature images
        </FieldLabel>
        <Button
          aria-label="Add feature image"
          onClick={() => onChange([...values, newImageField()])}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <PlusIcon weight="bold" />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {values.map((field, index) => (
          <div className="flex items-center gap-2" key={field.id}>
            <Input
              id={`${id}-${field.id}`}
              onChange={(event) => setAt(field.id, event.target.value)}
              placeholder={`https://… · image ${index + 1}`}
              required={index === 0}
              type="url"
              value={field.url}
            />
            <Button
              aria-label={`Remove image ${index + 1}`}
              disabled={values.length <= 1}
              onClick={() => removeAt(field.id)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <TrashIcon aria-hidden className="size-3.5" weight="bold" />
            </Button>
          </div>
        ))}
      </div>
    </Field>
  )
}

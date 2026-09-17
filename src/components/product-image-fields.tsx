import * as React from 'react'
import { ImageIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { toast } from '~/components/ui/toast'
import { shopImageSrc } from '~/data/shop'
import { uploadCatalogueImage } from '~/lib/catalogue-image.functions'

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

export function initialImageFields(urls: string[], min = 1): ImageUrlField[] {
  const next = urls.map((url) => url.trim()).filter(Boolean).map(newImageField)
  while (next.length < min) next.push(newImageField())
  return next
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Could not read image'))
        return
      }
      resolve(result)
    }
    reader.readAsDataURL(file)
  })
}

export function ProductImageFields({
  values,
  onChange,
}: {
  values: ImageUrlField[]
  onChange: (next: ImageUrlField[]) => void
}) {
  const id = React.useId()
  const [uploadingId, setUploadingId] = React.useState<string | null>(null)
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  function setAt(fieldId: string, url: string) {
    onChange(
      values.map((field) => (field.id === fieldId ? { ...field, url } : field)),
    )
  }

  function removeAt(fieldId: string) {
    const next = values.filter((field) => field.id !== fieldId)
    onChange(next.length > 0 ? next : [newImageField()])
  }

  async function onFileChange(
    fieldId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.add({ type: 'error', title: 'Use a JPG, PNG, or WebP image' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ type: 'error', title: 'Image must be 5MB or smaller' })
      return
    }

    setUploadingId(fieldId)
    try {
      const data = await readFileAsBase64(file)
      const uploaded = await uploadCatalogueImage({
        data: {
          contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          data,
        },
      })
      setAt(fieldId, uploaded.url)
      toast.add({ type: 'success', title: 'Image uploaded' })
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Could not upload image',
        description: error instanceof Error ? error.message : 'Try again',
      })
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>Feature images</FieldLabel>
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
      <FieldDescription>
        Upload JPG, PNG, or WebP up to 5MB. The first image is the main feature
        image.
      </FieldDescription>
      <div className="mt-2 flex flex-col gap-3">
        {values.map((field, index) => {
          const pending = uploadingId === field.id
          return (
            <div
              className="flex items-center gap-3 rounded-lg border border-border p-3"
              key={field.id}
            >
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                {field.url ? (
                  <img
                    alt=""
                    className="size-full object-cover"
                    decoding="async"
                    height={64}
                    src={shopImageSrc(field.url, 128)}
                    width={64}
                  />
                ) : (
                  <ImageIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {index === 0 ? 'Main image' : `Image ${index + 1}`}
                  {index === 0 ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      required
                    </span>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    id={`${id}-${field.id}`}
                    onChange={(event) => void onFileChange(field.id, event)}
                    ref={(node) => {
                      inputRefs.current[field.id] = node
                    }}
                    type="file"
                  />
                  <Button
                    disabled={pending}
                    onClick={() => inputRefs.current[field.id]?.click()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {pending
                      ? 'Uploading…'
                      : field.url
                        ? 'Replace'
                        : 'Upload'}
                  </Button>
                  <Button
                    aria-label={`Remove image ${index + 1}`}
                    disabled={pending || (values.length <= 1 && !field.url)}
                    onClick={() =>
                      field.url && values.length === 1
                        ? setAt(field.id, '')
                        : removeAt(field.id)
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <TrashIcon aria-hidden className="size-3.5" weight="bold" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Field>
  )
}

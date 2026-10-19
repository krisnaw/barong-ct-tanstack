import * as React from 'react'
import { ImageIcon, XIcon } from '@phosphor-icons/react'
import { Field } from '~/components/ui/field'
import { toast } from '~/components/ui/toast'
import { Spinner } from '~/components/ui/spinner'
import { shopImageSrc } from '~/data/shop'
import { uploadCatalogueImage } from '~/lib/catalogue-image.functions'
import { cn } from '~/lib/utils'

export type ImageUrlField = {
  id: string
  url: string
}

const MAX_IMAGES = 4
const tileClass = 'aspect-[4/5] w-40'

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
  productName = '',
}: {
  values: ImageUrlField[]
  onChange: (next: ImageUrlField[]) => void
  productName?: string
}) {
  const inputId = React.useId()
  const [uploadingId, setUploadingId] = React.useState<string | null>(null)
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const replaceId = React.useRef<string | null>(null)
  const filled = values.filter((field) => field.url.trim())
  const alt = productName.trim() || 'Product photo'
  const canAdd = filled.length < MAX_IMAGES

  function openPicker(fieldId: string | null) {
    replaceId.current = fieldId
    inputRef.current?.click()
  }

  function removeAt(fieldId: string) {
    const next = values.filter((field) => field.id !== fieldId && field.url.trim())
    onChange(next.length > 0 ? next : [newImageField()])
  }

  function moveTo(fieldId: string, toIndex: number) {
    const from = filled.findIndex((field) => field.id === fieldId)
    if (from < 0 || toIndex < 0 || toIndex >= filled.length || from === toIndex) return
    const next = [...filled]
    const [item] = next.splice(from, 1)
    next.splice(toIndex, 0, item)
    onChange(next)
  }

  function dropOn(fieldId: string) {
    if (!dragId) return
    moveTo(dragId, filled.findIndex((field) => field.id === fieldId))
    setDragId(null)
    setOverId(null)
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    const targetId = replaceId.current
    replaceId.current = null
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.add({ type: 'error', title: 'Use a JPG, PNG, or WebP image' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ type: 'error', title: 'Image must be 5MB or smaller' })
      return
    }

    const empty = values.find((field) => !field.url.trim())
    const slotId = targetId ?? empty?.id ?? 'new'
    if (slotId === 'new' && !canAdd) return

    setUploadingId(slotId)
    try {
      const data = await readFileAsBase64(file)
      const uploaded = await uploadCatalogueImage({
        data: {
          contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          data,
        },
      })
      if (slotId === 'new') {
        onChange([...filled, newImageField(uploaded.url)])
      } else {
        onChange(
          values.map((field) =>
            field.id === slotId ? { ...field, url: uploaded.url } : field,
          ),
        )
      }
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
      <div className="flex flex-wrap items-start gap-3">
        {filled.map((field, index) => {
          const pending = uploadingId === field.id
          return (
            <div
              className={cn(
                'relative cursor-move rounded-md',
                tileClass,
                overId === field.id && dragId !== field.id && 'ring-2 ring-foreground',
                dragId === field.id && 'opacity-50',
              )}
              draggable={!pending}
              key={field.id}
              onDragEnd={() => {
                setDragId(null)
                setOverId(null)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setOverId(field.id)
              }}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', field.id)
                setDragId(field.id)
              }}
              onDrop={(event) => {
                event.preventDefault()
                dropOn(field.id)
              }}
            >
                <button
                  aria-label={
                    index === 0
                      ? 'Replace cover photo'
                      : `Replace photo ${index + 1}`
                  }
                  className="size-full cursor-move overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  disabled={pending}
                  onClick={() => openPicker(field.id)}
                  type="button"
                >
                  <img
                    alt={alt}
                    className="pointer-events-none size-full object-cover"
                    decoding="async"
                    draggable={false}
                    height={400}
                    src={shopImageSrc(field.url, 400)}
                    width={320}
                  />
                </button>
                {index === 0 ? (
                  <span className="pointer-events-none absolute bottom-1 left-1 bg-foreground px-1 py-0.5 text-[0.6rem] font-medium tracking-wide text-background uppercase">
                    Cover
                  </span>
                ) : null}
                {pending ? (
                  <span className="absolute inset-0 grid place-items-center rounded-md bg-background/70">
                    <Spinner />
                  </span>
                ) : (
                  <button
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute top-1 right-1 grid size-5 cursor-pointer place-items-center rounded-full bg-background/90 text-foreground shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => removeAt(field.id)}
                    type="button"
                  >
                    <XIcon aria-hidden className="size-3" weight="bold" />
                  </button>
                )}
              </div>
          )
        })}

        {canAdd ? (
          <button
            aria-label={`Add photo, ${filled.length} of ${MAX_IMAGES}`}
            className={cn(
              'grid place-items-center rounded-md border border-dashed border-muted-foreground/40 text-destructive outline-none hover:border-destructive/60 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60',
              tileClass,
            )}
            disabled={uploadingId === 'new'}
            onClick={() => openPicker(null)}
            type="button"
          >
            {uploadingId === 'new' ? (
              <Spinner />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <ImageIcon aria-hidden className="size-5" weight="duotone" />
                <span className="text-xs tabular-nums">
                  ({filled.length}/{MAX_IMAGES})
                </span>
              </span>
            )}
          </button>
        ) : null}
      </div>

      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        id={inputId}
        onChange={(event) => void onFileChange(event)}
        ref={inputRef}
        type="file"
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        JPG, PNG, or WebP, up to 5MB. Drag a photo to change the order.
      </p>
    </Field>
  )
}

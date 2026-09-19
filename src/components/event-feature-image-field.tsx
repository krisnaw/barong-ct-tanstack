import * as React from 'react'
import { ImageIcon } from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { toast } from '~/components/ui/toast'
import { Spinner } from '~/components/ui/spinner'
import { eventImageSrc } from '~/data/events'
import { uploadCatalogueImage } from '~/lib/catalogue-image.functions'

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

export function EventFeatureImageField({
  imageUrl,
  imageAlt,
  onImageUrlChange,
  onImageAltChange,
}: {
  imageUrl: string
  imageAlt: string
  onImageUrlChange: (url: string) => void
  onImageAltChange: (alt: string) => void
}) {
  const id = React.useId()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = React.useState(false)

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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

    setUploading(true)
    try {
      const data = await readFileAsBase64(file)
      const uploaded = await uploadCatalogueImage({
        data: {
          contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          data,
        },
      })
      onImageUrlChange(uploaded.url)
      toast.add({ type: 'success', title: 'Image uploaded' })
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Could not upload image',
        description: error instanceof Error ? error.message : 'Try again',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>Feature image</FieldLabel>
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
            {imageUrl ? (
              <img
                alt=""
                className="size-full object-cover"
                decoding="async"
                height={80}
                src={eventImageSrc(imageUrl, 160)}
                width={80}
              />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id={id}
              onChange={(event) => void onFileChange(event)}
              ref={inputRef}
              type="file"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                size="sm"
                type="button"
                variant="outline"
              >
                {uploading ? (<><Spinner /> Uploading…</>) : imageUrl ? 'Replace' : 'Upload'}
              </Button>
              {imageUrl ? (
                <Button
                  disabled={uploading}
                  onClick={() => onImageUrlChange('')}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-alt`}>Image alt text</FieldLabel>
        <Input
          id={`${id}-alt`}
          onChange={(e) => onImageAltChange(e.target.value)}
          placeholder="Cyclists on a climb toward Kintamani"
          value={imageAlt}
        />
        <FieldDescription>
          Short description for accessibility. Defaults to the event name if
          empty.
        </FieldDescription>
      </Field>
    </div>
  )
}

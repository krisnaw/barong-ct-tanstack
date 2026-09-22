'use client'

import * as React from 'react'
import { cn } from '~/lib/utils'

export type TextEditorProps = {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  editorClassName?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
  'aria-labelledby'?: string
}

/**
 * TipTap must not load during Cloudflare SSR — it can duplicate React in the
 * workerd bundle and break hooks on the whole page. Load the editor on the
 * client only after mount.
 */
export function TextEditor(props: TextEditorProps) {
  const [Inner, setInner] = React.useState<React.ComponentType<TextEditorProps> | null>(
    null,
  )

  React.useEffect(() => {
    let cancelled = false
    void import('~/components/text-editor-inner').then((mod) => {
      if (!cancelled) setInner(() => mod.TextEditorInner)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!Inner) {
    return <TextEditorFallback {...props} />
  }

  return <Inner {...props} />
}

function TextEditorFallback({
  className,
  placeholder = 'Write something…',
  disabled = false,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
}: TextEditorProps) {
  return (
    <div
      aria-busy="true"
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        'overflow-hidden rounded-lg border border-input bg-transparent transition-colors',
        'dark:bg-input/30',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
      data-disabled={disabled || undefined}
      data-slot="text-editor"
    >
      <div className="flex h-9 items-center gap-0.5 border-b border-border px-1 py-1" />
      <div
        className="min-h-28 px-2.5 py-2 text-sm text-muted-foreground"
        id={id}
      >
        {placeholder}
      </div>
    </div>
  )
}

import * as React from 'react'
import {
  ListBulletsIcon,
  ListNumbersIcon,
  TextBIcon,
  TextItalicIcon,
} from '@phosphor-icons/react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { TextEditorProps } from '~/components/text-editor'

function normalizeEditorHtml(html: string) {
  const trimmed = html.trim()
  if (
    !trimmed ||
    trimmed === '<p></p>' ||
    trimmed === '<p><br></p>' ||
    trimmed === '<p><br/></p>'
  ) {
    return ''
  }
  return trimmed
}

export function TextEditorInner({
  value = '',
  onChange,
  placeholder = 'Write something…',
  disabled = false,
  id,
  className,
  editorClassName,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
}: TextEditorProps) {
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        ...(ariaInvalid != null
          ? { 'aria-invalid': String(ariaInvalid) }
          : {}),
        ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        class: cn(
          'min-h-28 px-2.5 py-2 text-sm outline-none',
          '[&_p]:mt-2 [&_p:first-child]:mt-0',
          '[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_li]:mt-1',
          '[&_strong]:font-semibold',
          '[&_em]:italic',
          editorClassName,
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      onChangeRef.current?.(normalizeEditorHtml(current.getHTML()))
    },
  })

  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  React.useEffect(() => {
    if (!editor) return
    const next = value || ''
    const current = normalizeEditorHtml(editor.getHTML())
    if (next === current) return
    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  const toolbarState = useEditorState({
    editor,
    selector: (snapshot) => ({
      isBold: snapshot.editor?.isActive('bold') ?? false,
      isItalic: snapshot.editor?.isActive('italic') ?? false,
      isBulletList: snapshot.editor?.isActive('bulletList') ?? false,
      isOrderedList: snapshot.editor?.isActive('orderedList') ?? false,
      isEmpty: snapshot.editor?.isEmpty ?? true,
    }),
  })

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-input bg-transparent transition-colors',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        'dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
      data-disabled={disabled || undefined}
      data-invalid={ariaInvalid === true || ariaInvalid === 'true' || undefined}
      data-slot="text-editor"
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1 py-1">
        <ToolbarButton
          active={toolbarState?.isBold}
          disabled={disabled || !editor}
          label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <TextBIcon weight="bold" />
        </ToolbarButton>
        <ToolbarButton
          active={toolbarState?.isItalic}
          disabled={disabled || !editor}
          label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <TextItalicIcon weight="bold" />
        </ToolbarButton>
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton
          active={toolbarState?.isBulletList}
          disabled={disabled || !editor}
          label="Bullet list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <ListBulletsIcon weight="bold" />
        </ToolbarButton>
        <ToolbarButton
          active={toolbarState?.isOrderedList}
          disabled={disabled || !editor}
          label="Numbered list"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListNumbersIcon weight="bold" />
        </ToolbarButton>
      </div>

      <div className="relative">
        {toolbarState?.isEmpty ? (
          <p
            aria-hidden
            className="pointer-events-none absolute top-2 left-2.5 text-sm text-muted-foreground"
          >
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      className={cn(active && 'bg-muted text-foreground')}
      disabled={disabled}
      onClick={onClick}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  )
}

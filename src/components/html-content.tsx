import { looksLikeHtml, sanitizeRichHtml } from '~/lib/rich-html'
import { cn } from '~/lib/utils'

export function HtmlContent({
  html,
  className,
}: {
  html: string
  className?: string
}) {
  const trimmed = html.trim()
  if (!trimmed) return null

  if (!looksLikeHtml(trimmed)) {
    return (
      <p className={cn('leading-relaxed text-muted-foreground', className)}>
        {trimmed}
      </p>
    )
  }

  return (
    <div
      className={cn(
        'max-w-none text-base leading-relaxed text-muted-foreground',
        '[&_p]:mt-3 [&_p:first-child]:mt-0',
        '[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:mt-1',
        '[&_strong]:font-semibold [&_strong]:text-foreground',
        '[&_em]:italic',
        '[&_a]:underline [&_a]:underline-offset-2 [&_a]:text-foreground',
        '[&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground',
        '[&_h3]:mt-5 [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground',
        '[&_br]:leading-[1.75]',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(trimmed) }}
    />
  )
}

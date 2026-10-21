import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { DownloadSimpleIcon, QrCodeIcon } from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Spinner } from '~/components/ui/spinner'

function loadQrCode() {
  return import('qrcode/lib/browser.js')
}

export function EventQrDialog({
  slug,
  name,
}: {
  slug: string
  name: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [eventUrl, setEventUrl] = React.useState('')
  const [dataUrl, setDataUrl] = React.useState('')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!open) return

    const path = router.buildLocation({
      to: '/events/$slug',
      params: { slug },
    }).href
    const url = new URL(path, window.location.origin).href
    let cancelled = false

    setEventUrl(url)
    setDataUrl('')
    setError('')

    void loadQrCode()
      .then((qr) =>
        qr.toDataURL(url, {
          width: 1024,
          margin: 2,
          errorCorrectionLevel: 'M',
        }),
      )
      .then((next) => {
        if (!cancelled) setDataUrl(next)
      })
      .catch(() => {
        if (!cancelled) setError('Could not create the QR code.')
      })

    return () => {
      cancelled = true
    }
  }, [open, router, slug])

  function download() {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${slug.replace(/[^\w.-]+/g, '-')}-qr.png`
    link.click()
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <QrCodeIcon weight="bold" />
        QR code
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Event QR code</DialogTitle>
          <DialogDescription>
            Scanning opens the public page for {name}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div className="flex size-56 items-center justify-center bg-white p-2">
            {dataUrl ? (
              <img
                alt={`QR code for ${name}`}
                className="size-full"
                height={1024}
                src={dataUrl}
                width={1024}
              />
            ) : error ? (
              <p className="px-4 text-center text-sm text-destructive">
                {error}
              </p>
            ) : (
              <Spinner className="size-5 text-neutral-500" />
            )}
          </div>
          {eventUrl ? (
            <p className="w-full break-all text-center text-xs text-muted-foreground">
              {eventUrl}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button disabled={!dataUrl} onClick={download} type="button">
            <DownloadSimpleIcon weight="bold" />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

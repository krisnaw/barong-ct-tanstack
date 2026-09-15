import * as React from 'react'
import type { CustomMeasurements } from '~/data/shop'

const STORAGE_KEY = 'barong-shop-cart'

export type CartItem = {
  slug: string
  size: string
  quantity: number
  custom?: CustomMeasurements
}

type CartContextValue = {
  items: CartItem[]
  addItem: (
    slug: string,
    size: string,
    quantity?: number,
    custom?: CustomMeasurements,
  ) => void
  setQuantity: (
    slug: string,
    size: string,
    quantity: number,
    custom?: CustomMeasurements,
  ) => void
  removeItem: (
    slug: string,
    size: string,
    custom?: CustomMeasurements,
  ) => void
  clear: () => void
  ready: boolean
  sheetOpen: boolean
  setSheetOpen: (open: boolean) => void
  openSheet: () => void
  closeSheet: () => void
}

const CartContext = React.createContext<CartContextValue | null>(null)

function sameCustom(
  a: CustomMeasurements | undefined,
  b: CustomMeasurements | undefined,
) {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    a.chest === b.chest &&
    a.sleeve === b.sleeve &&
    a.frontZipper === b.frontZipper &&
    a.back === b.back
  )
}

export function sameCartLine(
  item: CartItem,
  slug: string,
  size: string,
  custom?: CustomMeasurements,
) {
  return (
    item.slug === slug &&
    item.size === size &&
    sameCustom(item.custom, custom)
  )
}

export function cartLineKey(item: CartItem) {
  if (item.custom) {
    return `${item.slug}:${item.size}:${item.custom.chest}:${item.custom.sleeve}:${item.custom.frontZipper}:${item.custom.back}`
  }
  return `${item.slug}:${item.size}`
}

function isCustomMeasurements(value: unknown): value is CustomMeasurements {
  if (!value || typeof value !== 'object') return false
  const custom = value as CustomMeasurements
  return (
    typeof custom.chest === 'string' &&
    typeof custom.sleeve === 'string' &&
    typeof custom.frontZipper === 'string' &&
    typeof custom.back === 'string'
  )
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const item = value as CartItem
  const base =
    typeof item.slug === 'string' &&
    typeof item.size === 'string' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  if (!base) return false
  if (item.custom === undefined) return true
  return isCustomMeasurements(item.custom)
}

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCartItem)
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [ready, setReady] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  React.useEffect(() => {
    setItems(readCart())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  const addItem = React.useCallback(
    (
      slug: string,
      size: string,
      quantity = 1,
      custom?: CustomMeasurements,
    ) => {
      setItems((current) => {
        const index = current.findIndex((item) =>
          sameCartLine(item, slug, size, custom),
        )
        if (index === -1) {
          return [
            ...current,
            custom
              ? { slug, size, quantity, custom }
              : { slug, size, quantity },
          ]
        }
        return current.map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + quantity } : item,
        )
      })
    },
    [],
  )

  const setQuantity = React.useCallback(
    (
      slug: string,
      size: string,
      quantity: number,
      custom?: CustomMeasurements,
    ) => {
      setItems((current) => {
        if (quantity <= 0) {
          return current.filter(
            (item) => !sameCartLine(item, slug, size, custom),
          )
        }
        return current.map((item) =>
          sameCartLine(item, slug, size, custom)
            ? { ...item, quantity }
            : item,
        )
      })
    },
    [],
  )

  const removeItem = React.useCallback(
    (slug: string, size: string, custom?: CustomMeasurements) => {
      setItems((current) =>
        current.filter((item) => !sameCartLine(item, slug, size, custom)),
      )
    },
    [],
  )

  const clear = React.useCallback(() => setItems([]), [])
  const openSheet = React.useCallback(() => setSheetOpen(true), [])
  const closeSheet = React.useCallback(() => setSheetOpen(false), [])

  const value = React.useMemo(
    () => ({
      items,
      addItem,
      setQuantity,
      removeItem,
      clear,
      ready,
      sheetOpen,
      setSheetOpen,
      openSheet,
      closeSheet,
    }),
    [
      items,
      addItem,
      setQuantity,
      removeItem,
      clear,
      ready,
      sheetOpen,
      openSheet,
      closeSheet,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}

export function useCartCount() {
  const { items, ready } = useCart()
  return {
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    ready,
  }
}

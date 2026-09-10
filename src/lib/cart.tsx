import * as React from 'react'

const STORAGE_KEY = 'barong-shop-cart'

export type CartItem = {
  slug: string
  size: string
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (slug: string, size: string, quantity?: number) => void
  setQuantity: (slug: string, size: string, quantity: number) => void
  removeItem: (slug: string, size: string) => void
  clear: () => void
  ready: boolean
}

const CartContext = React.createContext<CartContextValue | null>(null)

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const item = value as CartItem
  return (
    typeof item.slug === 'string' &&
    typeof item.size === 'string' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  )
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

  React.useEffect(() => {
    setItems(readCart())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  const addItem = React.useCallback(
    (slug: string, size: string, quantity = 1) => {
      setItems((current) => {
        const index = current.findIndex(
          (item) => item.slug === slug && item.size === size,
        )
        if (index === -1) {
          return [...current, { slug, size, quantity }]
        }
        return current.map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + quantity } : item,
        )
      })
    },
    [],
  )

  const setQuantity = React.useCallback(
    (slug: string, size: string, quantity: number) => {
      setItems((current) => {
        if (quantity <= 0) {
          return current.filter(
            (item) => !(item.slug === slug && item.size === size),
          )
        }
        return current.map((item) =>
          item.slug === slug && item.size === size
            ? { ...item, quantity }
            : item,
        )
      })
    },
    [],
  )

  const removeItem = React.useCallback((slug: string, size: string) => {
    setItems((current) =>
      current.filter((item) => !(item.slug === slug && item.size === size)),
    )
  }, [])

  const clear = React.useCallback(() => setItems([]), [])

  const value = React.useMemo(
    () => ({ items, addItem, setQuantity, removeItem, clear, ready }),
    [items, addItem, setQuantity, removeItem, clear, ready],
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
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return { count, ready }
}

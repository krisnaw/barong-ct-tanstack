import * as React from 'react'
import {
  shopOrders,
  type OrderPayment,
  type OrderStatus,
  type ShopOrder,
} from '~/data/orders'

const STORAGE_KEY = 'barong-shop-orders'

type StoredState = {
  extras: ShopOrder[]
  statuses: Record<string, OrderStatus>
  payments: Record<string, OrderPayment>
}

function emptyState(): StoredState {
  return { extras: [], statuses: {}, payments: {} }
}

function isOrder(value: unknown): value is ShopOrder {
  if (!value || typeof value !== 'object') return false
  const order = value as ShopOrder
  return (
    typeof order.id === 'string' &&
    typeof order.placedAt === 'string' &&
    Array.isArray(order.lines)
  )
}

function readState(): StoredState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<StoredState>
    return {
      extras: Array.isArray(parsed.extras) ? parsed.extras.filter(isOrder) : [],
      statuses:
        parsed.statuses && typeof parsed.statuses === 'object'
          ? parsed.statuses
          : {},
      payments:
        parsed.payments && typeof parsed.payments === 'object'
          ? parsed.payments
          : {},
    }
  } catch {
    return emptyState()
  }
}

function writeState(state: StoredState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function applyOverrides(order: ShopOrder, stored: StoredState): ShopOrder {
  return {
    ...order,
    status: stored.statuses[order.id] ?? order.status,
    payment: stored.payments[order.id] ?? order.payment,
  }
}

export function resolveShopOrders(): ShopOrder[] {
  const stored = readState()
  const extras = stored.extras.filter(
    (order) => !shopOrders.some((seed) => seed.id === order.id),
  )
  return [...extras, ...shopOrders]
    .map((order) => applyOverrides(order, stored))
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
}

export function addPlacedOrder(order: ShopOrder) {
  const stored = readState()
  stored.extras = [order, ...stored.extras.filter((item) => item.id !== order.id)]
  writeState(stored)
}

export function useShopOrders() {
  const [orders, setOrders] = React.useState<ShopOrder[]>(shopOrders)
  const [ready, setReady] = React.useState(false)

  const refresh = React.useCallback(() => {
    setOrders(resolveShopOrders())
    setReady(true)
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const updateStatus = React.useCallback((id: string, status: OrderStatus) => {
    const stored = readState()
    stored.statuses = { ...stored.statuses, [id]: status }
    writeState(stored)
    setOrders(resolveShopOrders())
  }, [])

  const updatePayment = React.useCallback((id: string, payment: OrderPayment) => {
    const stored = readState()
    stored.payments = { ...stored.payments, [id]: payment }
    writeState(stored)
    setOrders(resolveShopOrders())
  }, [])

  const getOrder = React.useCallback(
    (id: string) => orders.find((order) => order.id === id),
    [orders],
  )

  return { orders, ready, getOrder, updateStatus, updatePayment }
}

import { formatIdr } from '~/data/events'

export type ShopProduct = {
  id: string
  slug: string
  name: string
  color: string
  colorHex: string
  price: number
  description: string
  fabric: string
  features: string[]
  sizes: string[]
  stockBySize: Record<string, number>
  preOrder: boolean
  active?: boolean
  image: string
  images: string[]
  imageAlt: string
}

export const CUSTOM_SIZE = 'Custom'

export type CustomMeasurements = {
  chest: string
  sleeve: string
  frontZipper: string
  back: string
}

export function formatCustomMeasurements(custom: CustomMeasurements) {
  return `Chest ${custom.chest} · Sleeve ${custom.sleeve} · Front zipper ${custom.frontZipper} · Back ${custom.back}`
}

export function customMeasurementsComplete(custom: CustomMeasurements) {
  return (
    custom.chest.trim() !== '' &&
    custom.sleeve.trim() !== '' &&
    custom.frontZipper.trim() !== '' &&
    custom.back.trim() !== ''
  )
}

export function shopImageSrc(image: string, width: number) {
  const separator = image.includes('?') ? '&' : '?'
  if (image.includes('cdn.shopify.com')) {
    return `${image}${separator}width=${width}`
  }
  return `${image}${separator}w=${width}&q=75`
}

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const jerseySizeGuide = {
  sizes,
  unit: 'cm',
  rows: [
    { label: 'Chest', values: [84, 88, 94, 100, 106, 112] },
    { label: 'Waist', values: [72, 76, 82, 88, 94, 100] },
    { label: 'Front length', values: [51, 53, 55, 57, 59, 61] },
  ],
  note: 'Race-fit. Measure around the fullest part of the chest. If you sit between sizes, take the larger for Bali heat.',
}

/** Size buttons shown on the PDP. Custom is pre-order only. */
export function productSizeOptions(product: ShopProduct): string[] {
  if (product.preOrder) {
    return [...jerseySizeGuide.sizes, CUSTOM_SIZE]
  }
  return jerseySizeGuide.sizes.filter((size) => (product.stockBySize[size] ?? 0) > 0)
}

export function isSizePurchasable(product: ShopProduct, size: string) {
  if (size === CUSTOM_SIZE) return product.preOrder
  if (!jerseySizeGuide.sizes.includes(size)) return false
  if (product.preOrder) return true
  return (product.stockBySize[size] ?? 0) > 0
}

export function availableSizeCount(product: ShopProduct) {
  if (product.preOrder) return jerseySizeGuide.sizes.length
  return jerseySizeGuide.sizes.filter((size) => (product.stockBySize[size] ?? 0) > 0)
    .length
}

export function findShopProduct(products: ShopProduct[], slug: string) {
  return products.find((product) => product.slug === slug)
}

export function formatShopPrice(amount: number) {
  return formatIdr(amount)
}

export type ProductRequestVariationType = 'cores' | 'estampas' | 'variados'

export type ProductRequestSizeMeasureEntry = {
  size: string
  measurement: string
}

export type ProductRequestSizeOption = {
  code: string
  label: string
  category: string
}

export type ProductRequestSizeGroup = {
  id: 'adulto' | 'infantil' | 'sapato'
  label: string
  items: ProductRequestSizeOption[]
}

export type ProductRequestImageLink = {
  fileId: string
  fileName: string
  originalUrl: string
  usableUrl: string
}

export type ProductRequestRecord = {
  id: string
  createdAt: string
  cliente: string
  requesterName: string
  requesterEmail: string
  productName: string
  productCost: number
  sizes: string[]
  sizeChart: string
  variationType: ProductRequestVariationType
  variations: string[]
  imageCount: number
  folderUrl: string
  imageLinks: ProductRequestImageLink[]
  status: string
  origin: string
  notes?: string
}

export type ProductRequestOptions = {
  sizeGroups: ProductRequestSizeGroup[]
  colors: string[]
  stores: string[]
  defaultStore?: string
}

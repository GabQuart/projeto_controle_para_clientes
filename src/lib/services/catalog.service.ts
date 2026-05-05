import { createAdminClient } from '@/utils/supabase/admin'
import {
  buildGoogleDriveFolderLink,
  type DriveImageReference,
  extractGoogleDriveId,
  isGoogleDriveFolderLink,
  resolveReferenceImage,
  resolveReferenceImageGallery,
} from '@/lib/google/drive'
import { compactText, normalizeText, splitList, toBooleanFlag } from '@/lib/utils/format'
import { buildDriveImageApiUrl } from '@/lib/utils/drive-url'
import { matchesSkuTerm, normalizeSku } from '@/lib/utils/sku'
import { getCatalogCache, patchCatalogCacheItems } from '@/lib/services/catalog-cache.service'
import type {
  CatalogCacheMetadata,
  CatalogProduct,
  CatalogQuery,
  CatalogStatusFilter,
  CatalogVariant,
} from '@/types/catalog'

type VariantStatus = CatalogVariant['status']
type ProductStatus = CatalogProduct['status']

type MirrorProductRow = {
  sku_base: string
  prefixo_sku?: string | null
  cliente_cod?: string | null
  loja?: string | null
  titulo?: string | null
  cores?: string[] | string | null
  tamanhos?: string[] | string | null
  status?: string | null
  midia_link?: string | null
}

type MirrorVariantRow = {
  sku: string
  sku_base?: string | null
  prefixo_sku?: string | null
  cliente_cod?: string | null
  loja?: string | null
  titulo?: string | null
  cor?: string | null
  tamanho?: string | null
  status?: string | null
  midia_link?: string | null
}

type ClientRow = {
  fornecedor_cod?: string | null
  loja_id?: number | null
}

type StoreRow = {
  id: number
  nome?: string | null
}

const PRODUCT_TABLE = 'catalogo_produtos'
const VARIANT_TABLE = 'variacoes_sku'
const CLIENT_TABLE = 'clientes'
const STORE_TABLE = 'lojas'
const BATCH_SIZE = 1000

function parseListValue(value?: string[] | string | null) {
  if (Array.isArray(value)) {
    return value.map((item) => compactText(String(item))).filter(Boolean)
  }

  return splitList(value)
}

function normalizeCatalogStatus(value?: string | null): VariantStatus {
  return toBooleanFlag(value) ? 'ativo' : 'inativo'
}

function buildProductImageApiPath(link?: string) {
  const driveId = extractGoogleDriveId(link)

  if (!driveId) {
    return ''
  }

  const kind = isGoogleDriveFolderLink(link) ? 'folder' : 'file'
  return buildDriveImageApiUrl(driveId, kind)
}

function buildProductImageApiPathFromReference(reference?: DriveImageReference | null) {
  if (!reference?.fileId) {
    return reference?.usableUrl ?? ''
  }

  return buildDriveImageApiUrl(reference.fileId, 'file')
}

async function readAllRows<RowType>(table: string, columns = '*') {
  const supabase = createAdminClient()
  const rows: RowType[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + BATCH_SIZE - 1)

    if (error) {
      throw new Error(`Falha ao ler ${table} no Supabase: ${error.message}`)
    }

    const batch = (data ?? []) as RowType[]
    rows.push(...batch)

    if (batch.length < BATCH_SIZE) {
      return rows
    }

    from += BATCH_SIZE
  }
}

function buildStoreByClientMap(clients: ClientRow[], stores: StoreRow[]) {
  const storesById = new Map(stores.map((store) => [store.id, compactText(store.nome ?? '')]))
  const clientMap = new Map<string, string>()

  for (const client of clients) {
    const fornecedorCod = normalizeSku(client.fornecedor_cod)
    const loja = storesById.get(Number(client.loja_id)) || ''

    if (fornecedorCod && loja) {
      clientMap.set(fornecedorCod, loja)
    }
  }

  return clientMap
}

function mapProductRow(row: MirrorProductRow, storeByClient: Map<string, string>): CatalogProduct {
  const skuBase = normalizeSku(row.sku_base)
  const clienteCod = normalizeSku(row.cliente_cod || row.prefixo_sku)
  const prefixoSku = normalizeSku(row.prefixo_sku || clienteCod)
  const loja = compactText(row.loja || '') || storeByClient.get(prefixoSku) || storeByClient.get(clienteCod) || clienteCod
  const fotoLink = compactText(row.midia_link || '')
  const fotoDriveKind = isGoogleDriveFolderLink(fotoLink) ? 'folder' : 'file'
  const fotoFileId = extractGoogleDriveId(fotoLink)
  const baseStatus = normalizeCatalogStatus(row.status)

  return {
    id: skuBase,
    clienteCod,
    loja,
    skuBase,
    prefixoSku,
    titulo: compactText(row.titulo || ''),
    fotoRef: buildProductImageApiPath(fotoLink),
    fotoFileId,
    fotoDriveKind,
    cores: parseListValue(row.cores),
    tamanhos: parseListValue(row.tamanhos),
    ativo: baseStatus !== 'inativo',
    status: baseStatus,
    inactiveVariantCount: 0,
    activeVariantCount: 0,
    variacoes: [],
  }
}

function mapVariantRow(row: MirrorVariantRow, storeByClient: Map<string, string>): CatalogVariant & { loja: string; titulo?: string } {
  const sku = normalizeSku(row.sku)
  const skuBase = normalizeSku(row.sku_base)
  const clienteCod = normalizeSku(row.cliente_cod || row.prefixo_sku)
  const prefixoSku = normalizeSku(row.prefixo_sku || clienteCod)
  const loja = compactText(row.loja || '') || storeByClient.get(prefixoSku) || storeByClient.get(clienteCod) || clienteCod
  const status = normalizeCatalogStatus(row.status)

  return {
    id: sku,
    sku,
    skuBase,
    variacao: compactText(row.cor || ''),
    cor: compactText(row.cor || '') || undefined,
    tamanho: compactText(row.tamanho || '') || undefined,
    ativo: status === 'ativo',
    status,
    loja,
    titulo: compactText(row.titulo || '') || undefined,
  }
}

function finalizeProductStatus(product: CatalogProduct): CatalogProduct {
  const totalVariants = product.variacoes.length

  if (totalVariants === 0) {
    const status: ProductStatus = product.ativo ? 'ativo' : 'inativo'
    return {
      ...product,
      status,
      inactiveVariantCount: status === 'inativo' ? 1 : 0,
      activeVariantCount: status === 'ativo' ? 1 : 0,
    }
  }

  const activeVariantCount = product.variacoes.filter((variant) => Boolean(variant.ativo)).length
  const inactiveVariantCount = totalVariants - activeVariantCount
  const status: ProductStatus = activeVariantCount === 0 ? 'inativo' : inactiveVariantCount === 0 ? 'ativo' : 'parcial'

  return {
    ...product,
    ativo: status !== 'inativo',
    status,
    activeVariantCount,
    inactiveVariantCount,
  }
}

function matchesStatusFilter(product: CatalogProduct, statusFilter?: CatalogStatusFilter) {
  if (!statusFilter || statusFilter === 'todos') {
    return true
  }

  if (statusFilter === 'ativos') {
    return product.status === 'ativo'
  }

  if (statusFilter === 'inativos') {
    return product.status === 'inativo'
  }

  return (product.inactiveVariantCount ?? 0) > 0
}

function filterCatalog(products: CatalogProduct[], query: CatalogQuery) {
  return products.filter((product) => {
    if (query.clienteCod && product.clienteCod !== query.clienteCod) {
      return false
    }

    if (!matchesStatusFilter(product, query.statusFilter)) {
      return false
    }

    const normalizedTerm = normalizeText(query.termo)

    if (!normalizedTerm) {
      return true
    }

    const matchesTitle = normalizeText(product.titulo).includes(normalizedTerm)
    const matchesSku = matchesSkuTerm([product.skuBase, ...product.variacoes.map((item) => item.sku)], query.termo)

    return matchesTitle || matchesSku
  })
}

function isResolvedDriveImage(product: CatalogProduct) {
  return Boolean(product.fotoRef?.includes('/api/catalogo/imagem/') && product.fotoRef.includes('kind=file'))
}

function normalizeDriveImageSrc(value?: string, kind: 'file' | 'folder' = 'file') {
  if (!value) {
    return ''
  }

  if (value.startsWith('/api/catalogo/imagem/') || value.startsWith('/placeholder-product.svg')) {
    return value
  }

  if (!/drive\.google\.com/i.test(value)) {
    return value
  }

  const driveId = extractGoogleDriveId(value)

  if (!driveId) {
    return value
  }

  return buildDriveImageApiUrl(driveId, kind)
}

function normalizeCatalogProductImageReferences(product: CatalogProduct): CatalogProduct {
  const fotoRef = normalizeDriveImageSrc(product.fotoRef, 'file') || product.fotoRef || '/placeholder-product.svg'
  const fotoGaleria = product.fotoGaleria?.map((image) => normalizeDriveImageSrc(image, 'file') || image).filter(Boolean)

  return {
    ...product,
    fotoRef,
    fotoGaleria: fotoGaleria?.length ? Array.from(new Set(fotoGaleria)) : product.fotoGaleria,
  }
}

function normalizeGalleryUrls(product: CatalogProduct, images: string[]) {
  const uniqueImages = Array.from(new Set(images.filter(Boolean)))

  if (uniqueImages.length > 0) {
    return uniqueImages.slice(0, 3)
  }

  if (product.fotoRef) {
    return [product.fotoRef]
  }

  return ['/placeholder-product.svg']
}

async function fetchCatalogFromSource() {
  const [productRows, variantRows, clientRows, storeRows] = await Promise.all([
    readAllRows<MirrorProductRow>(PRODUCT_TABLE),
    readAllRows<MirrorVariantRow>(VARIANT_TABLE),
    readAllRows<ClientRow>(CLIENT_TABLE),
    readAllRows<StoreRow>(STORE_TABLE),
  ])

  const storeByClient = buildStoreByClientMap(clientRows, storeRows)
  const productMap = new Map<string, CatalogProduct>()

  for (const row of productRows) {
    const product = mapProductRow(row, storeByClient)
    productMap.set(product.skuBase, product)
  }

  for (const row of variantRows) {
    const variant = mapVariantRow(row, storeByClient)
    const product = productMap.get(variant.skuBase)

    if (product) {
      product.variacoes.push(variant)
      continue
    }

    productMap.set(
      variant.skuBase,
      finalizeProductStatus({
        id: variant.skuBase,
        clienteCod: normalizeSku(row.cliente_cod || row.prefixo_sku),
        loja: variant.loja,
        skuBase: variant.skuBase,
        prefixoSku: normalizeSku(row.prefixo_sku || row.cliente_cod),
        titulo: variant.titulo || variant.skuBase,
        fotoRef: '/placeholder-product.svg',
        ativo: variant.ativo,
        status: variant.status,
        inactiveVariantCount: variant.ativo ? 0 : 1,
        activeVariantCount: variant.ativo ? 1 : 0,
        variacoes: [variant],
      }),
    )
  }

  return Array.from(productMap.values())
    .map<CatalogProduct>((product) => {
      const finalized = finalizeProductStatus(product)
      return {
        ...finalized,
        fotoRef: finalized.fotoRef || '/placeholder-product.svg',
      }
    })
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
}

async function getCatalogBase(options: { forceRefresh?: boolean } = {}) {
  return getCatalogCache(fetchCatalogFromSource, options)
}

export async function listCatalog(query: CatalogQuery = {}) {
  const { items } = await getCatalogBase({ forceRefresh: query.forceRefresh })
  return filterCatalog(items.map(normalizeCatalogProductImageReferences), query)
}

export async function enrichCatalogProductImages(products: CatalogProduct[]) {
  const pendingProducts = products.filter(
    (product) => product.fotoDriveKind === 'folder' && product.fotoFileId && !isResolvedDriveImage(product),
  )

  if (pendingProducts.length === 0) {
    return products
  }

  const resolvedEntries = await Promise.all(
    pendingProducts.map(async (product) => {
      try {
        const image = await resolveReferenceImage(buildGoogleDriveFolderLink(product.fotoFileId))

        const fotoRef = buildProductImageApiPathFromReference(image)

        if (!fotoRef) {
          return null
        }

        return {
          skuBase: product.skuBase,
          fotoRef,
        }
      } catch {
        return null
      }
    }),
  )

  const resolvedMap = new Map(
    resolvedEntries
      .filter((entry): entry is { skuBase: string; fotoRef: string } => Boolean(entry?.fotoRef))
      .map((entry) => [entry.skuBase, entry]),
  )

  if (resolvedMap.size === 0) {
    return products
  }

  await patchCatalogCacheItems((items) =>
    items.map((product) => {
      const resolved = resolvedMap.get(product.skuBase)

      if (!resolved) {
        return product
      }

      return {
        ...product,
        fotoRef: resolved.fotoRef,
      }
    }),
  )

  return products.map((product) => {
    const resolved = resolvedMap.get(product.skuBase)

    if (!resolved) {
      return product
    }

    return {
      ...product,
      fotoRef: resolved.fotoRef,
    }
  })
}

export async function getCatalogCacheMetadata(options: { forceRefresh?: boolean } = {}) {
  const { metadata } = await getCatalogBase(options)
  return metadata satisfies CatalogCacheMetadata
}

export async function getCatalogSnapshotItem(input: { skuBase: string; skuVariacao?: string; forceRefresh?: boolean }) {
  const { items: catalog } = await getCatalogBase({ forceRefresh: input.forceRefresh })
  const product = catalog.map(normalizeCatalogProductImageReferences).find((item) => item.skuBase === normalizeSku(input.skuBase))

  if (!product) {
    throw new Error('Produto nao encontrado para gerar snapshot da solicitacao')
  }

  const variant = input.skuVariacao
    ? product.variacoes.find((item) => item.sku === normalizeSku(input.skuVariacao))
    : undefined

  return {
    product,
    variant,
  }
}

export async function getCatalogProductGallery(input: { skuBase: string; forceRefresh?: boolean }) {
  const normalizedSkuBase = normalizeSku(input.skuBase)
  const { items } = await getCatalogBase({ forceRefresh: input.forceRefresh })
  const product = items.map(normalizeCatalogProductImageReferences).find((item) => item.skuBase === normalizedSkuBase)

  if (!product) {
    throw new Error('Produto nao encontrado para carregar a galeria.')
  }

  if (product.fotoGaleria?.length) {
    return product.fotoGaleria
  }

  if (product.fotoDriveKind !== 'folder' || !product.fotoFileId) {
    return normalizeGalleryUrls(product, [product.fotoRef || '/placeholder-product.svg'])
  }

  const gallery = await resolveReferenceImageGallery(buildGoogleDriveFolderLink(product.fotoFileId), { limit: 3 })
  const urls = normalizeGalleryUrls(
    product,
    gallery.images.map(buildProductImageApiPathFromReference).filter(Boolean),
  )
  const galleryFileIds = gallery.images.map((image) => image.fileId || '').filter(Boolean)

  await patchCatalogCacheItems((cachedItems) =>
    cachedItems.map((cachedProduct) => {
      if (cachedProduct.skuBase !== normalizedSkuBase) {
        return cachedProduct
      }

      return {
        ...cachedProduct,
        fotoRef: urls[0] || cachedProduct.fotoRef,
        fotoGaleria: urls,
        fotoGaleriaFileIds: galleryFileIds,
      }
    }),
  )

  return urls
}

export async function updateCatalogVariantStatuses(statusBySku: Record<string, boolean>) {
  const normalizedEntries = Object.entries(statusBySku).map(([sku, active]) => [normalizeSku(sku), active] as const)
  const normalizedMap = new Map(normalizedEntries)

  return patchCatalogCacheItems((items) =>
    items.map((product) => {
      let hasRelevantChange = false

      const variacoes = product.variacoes.map((variant) => {
        const nextStatus = normalizedMap.get(normalizeSku(variant.sku))

        if (typeof nextStatus !== 'boolean') {
          return variant
        }

        hasRelevantChange = true
        const status: VariantStatus = nextStatus ? 'ativo' : 'inativo'
        return {
          ...variant,
          ativo: nextStatus,
          status,
        }
      })

      if (!hasRelevantChange) {
        return product
      }

      return finalizeProductStatus({
        ...product,
        variacoes,
      })
    }),
  )
}

import { readMultipleSheetTabs } from '@/lib/google/sheets'
import {
  buildGoogleDriveFolderLink,
  extractGoogleDriveId,
  isGoogleDriveFolderLink,
  resolveReferenceImage,
  resolveReferenceImageGallery,
} from '@/lib/google/drive'
import { compactText, normalizeText, splitList, toBooleanFlag } from '@/lib/utils/format'
import { buildDriveThumbnailUrl } from '@/lib/utils/drive-url'
import { extractSkuBase, matchesSkuTerm, normalizeSku } from '@/lib/utils/sku'
import { getCatalogCache, patchCatalogCacheItems } from '@/lib/services/catalog-cache.service'
import type { CatalogCacheMetadata, CatalogProduct, CatalogQuery, CatalogVariant } from '@/types/catalog'

const SOURCE_SHEET_ID = process.env.GOOGLE_SOURCE_SHEET_ID ?? ''
const PRODUCT_SHEET = 'CATALOGO_PRODUTOS'
const VARIANT_SHEET = 'VARIACOES_SKU'
const CLIENT_SHEET = 'DIC_CLIENTES'

function buildProductImageApiPath(link?: string) {
  const driveId = extractGoogleDriveId(link)

  if (!driveId) {
    return ''
  }

  const kind = isGoogleDriveFolderLink(link) ? 'folder' : 'file'
  return `/api/catalogo/imagem/${driveId}?kind=${kind}`
}

function mapStoreDictionary(rows: Record<string, string | undefined>[]) {
  return rows.reduce<Record<string, string>>((accumulator, row) => {
    const clienteCod = compactText(row.fornecedor_cod)
    const loja = compactText(row.loja)

    if (clienteCod) {
      accumulator[clienteCod] = loja || clienteCod
    }

    return accumulator
  }, {})
}

function buildProductRow(row: Record<string, string | undefined>, storeByClient: Record<string, string>): CatalogProduct {
  const clienteCod = compactText(row.cd_cliente)
  const skuBase = normalizeSku(row.id_produto || `${clienteCod}.${row.num_prod}`)
  const fotoLink = row['midia__hyperlink'] ?? row.midia
  const fotoDriveKind = isGoogleDriveFolderLink(fotoLink) ? 'folder' : 'file'
  const fotoFileId = extractGoogleDriveId(fotoLink)

  return {
    id: skuBase,
    clienteCod,
    loja: storeByClient[clienteCod] ?? clienteCod,
    skuBase,
    titulo: compactText(row.Titulo),
    fotoRef: fotoDriveKind === 'file' ? buildDriveThumbnailUrl(fotoFileId) : buildProductImageApiPath(fotoLink),
    fotoFileId,
    fotoDriveKind,
    cores: splitList(row.Cores),
    tamanhos: splitList(row.Tamanhos),
    ativo: true,
    variacoes: [],
  }
}

function buildVariantRow(row: Record<string, string | undefined>): CatalogVariant {
  const sku = normalizeSku(row.sku)
  const clienteCod = compactText(row.Cliente)
  const numProd = compactText(row.num_prod)
  const variacao = compactText(row['Variação'] ?? row['VariaÃ§Ã£o'])
  const tamanho = compactText(row.Tamanho)
  const derivedSkuBase = normalizeSku(clienteCod && numProd ? `${clienteCod}.${numProd}` : '')

  return {
    id: sku,
    sku,
    skuBase: derivedSkuBase || extractSkuBase(sku || `${row.Cliente}.${row.num_prod}`),
    variacao,
    cor: variacao || undefined,
    tamanho: tamanho || undefined,
    ativo: toBooleanFlag(row.ativo),
  }
}

function filterCatalog(products: CatalogProduct[], query: CatalogQuery) {
  return products.filter((product) => {
    if (query.clienteCod && product.clienteCod !== query.clienteCod) {
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
  return Boolean(product.fotoRef?.includes('drive.google.com/thumbnail'))
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
  if (!SOURCE_SHEET_ID) {
    throw new Error('GOOGLE_SOURCE_SHEET_ID nao configurado')
  }

  const sheets = await readMultipleSheetTabs(SOURCE_SHEET_ID, [PRODUCT_SHEET, VARIANT_SHEET, CLIENT_SHEET])
  const stores = mapStoreDictionary(sheets[CLIENT_SHEET] ?? [])

  const productMap = new Map<string, CatalogProduct>()

  for (const row of sheets[PRODUCT_SHEET] ?? []) {
    const product = buildProductRow(row, stores)
    productMap.set(product.skuBase, product)
  }

  for (const row of sheets[VARIANT_SHEET] ?? []) {
    const variant = buildVariantRow(row)
    const product = productMap.get(variant.skuBase)

    if (!product) {
      continue
    }

    product.variacoes.push(variant)
  }

  return Array.from(productMap.values())
    .map((product) => {
      const activeVariants = product.variacoes.filter((variant) => variant.ativo)
      return {
        ...product,
        ativo: activeVariants.length > 0,
        fotoRef: product.fotoRef || '/placeholder-product.svg',
      }
    })
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
}

async function getCatalogBase(options: { forceRefresh?: boolean } = {}) {
  return getCatalogCache(fetchCatalogFromSource, options)
}

export async function listCatalog(query: CatalogQuery = {}) {
  const { items } = await getCatalogBase({ forceRefresh: query.forceRefresh })
  return filterCatalog(items, query)
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

        if (!image.usableUrl) {
          return null
        }

        return {
          skuBase: product.skuBase,
          fotoRef: image.usableUrl,
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
  const product = catalog.find((item) => item.skuBase === normalizeSku(input.skuBase))

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
  const product = items.find((item) => item.skuBase === normalizedSkuBase)

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
    gallery.images.map((image) => image.usableUrl || '').filter(Boolean),
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
        return {
          ...variant,
          ativo: nextStatus,
        }
      })

      if (!hasRelevantChange) {
        return product
      }

      return {
        ...product,
        variacoes,
        ativo: variacoes.some((variant) => Boolean(variant.ativo)),
      }
    }),
  )
}


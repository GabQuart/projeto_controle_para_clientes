import { readMultipleSheetTabs } from '@/lib/google/sheets'
import { compactText, normalizeText, splitList, toBooleanFlag } from '@/lib/utils/format'
import { extractGoogleDriveId } from '@/lib/google/drive'
import { extractSkuBase, matchesSkuTerm, normalizeSku } from '@/lib/utils/sku'
import type { CatalogProduct, CatalogQuery, CatalogVariant } from '@/types/catalog'

const SOURCE_SHEET_ID = process.env.GOOGLE_SOURCE_SHEET_ID ?? ''
const PRODUCT_SHEET = 'CATALOGO_PRODUTOS'
const VARIANT_SHEET = 'VARIACOES_SKU'
const CLIENT_SHEET = 'DIC_CLIENTES'

function buildProductImageApiPath(link?: string) {
  const driveId = extractGoogleDriveId(link)

  if (!driveId) {
    return ''
  }

  const kind = (link ?? '').includes('/folders/') ? 'folder' : 'file'
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

  return {
    id: skuBase,
    clienteCod,
    loja: storeByClient[clienteCod] ?? clienteCod,
    skuBase,
    titulo: compactText(row.Titulo),
    fotoRef: buildProductImageApiPath(fotoLink),
    fotoFileId: extractGoogleDriveId(fotoLink),
    cores: splitList(row.Cores),
    tamanhos: splitList(row.Tamanhos),
    ativo: true,
    variacoes: [],
  }
}

function buildVariantRow(row: Record<string, string | undefined>): CatalogVariant {
  const sku = normalizeSku(row.sku)
  const variacao = compactText(row['Variação'])
  const tamanho = compactText(row.Tamanho)

  return {
    id: sku,
    sku,
    skuBase: extractSkuBase(sku || `${row.Cliente}.${row.num_prod}`),
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

export async function listCatalog(query: CatalogQuery = {}) {
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

  const catalog = Array.from(productMap.values()).map((product) => {
    const activeVariants = product.variacoes.filter((variant) => variant.ativo)
    return {
      ...product,
      ativo: activeVariants.length > 0,
      fotoRef: product.fotoRef || '/placeholder-product.svg',
    }
  })

  return filterCatalog(catalog, query).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
}

export async function getCatalogSnapshotItem(input: { skuBase: string; skuVariacao?: string }) {
  const catalog = await listCatalog({})
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

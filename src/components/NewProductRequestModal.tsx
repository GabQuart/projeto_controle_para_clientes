'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertModal } from '@/components/AlertModal'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider'
import { useRequestQueue } from '@/contexts/RequestQueueContext'
import { isNetworkError } from '@/lib/queue/request-queue'
import { translateColorLabel } from '@/lib/i18n/content'
import type { UserAccount } from '@/types/account'
import type {
  ProductRequestOptions,
  ProductRequestRecord,
  ProductRequestSizeMeasureEntry,
  ProductRequestVariationType,
} from '@/types/product-request'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type SelectedImage = {
  file: File
  previewUrl: string
}

type MeasurementRow = {
  type: string  // selecionado do dropdown
  value: string // campo de texto
}

type SizeSections = {
  superior: MeasurementRow[]
  inferior: MeasurementRow[]
}

type SizeMeasurementMap = Record<string, SizeSections>

type NewProductRequestModalProps = {
  open: boolean
  account: UserAccount | null
  onClose: () => void
  onCreated?: (request: ProductRequestRecord) => void
  onSuccessMessage?: (message: string) => void
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_IMAGE_FILES = 8

const EMPTY_OPTIONS: ProductRequestOptions = {
  sizeGroups: [],
  colors: [],
  stores: [],
}

const MEASURE_TYPES = [
  'Comprimento',
  'Comprimento total',
  'Comprimento interno',
  'Largura',
  'Altura',
  'Profundidade',
  'Manga',
  'Ombro',
  'Peito',
  'Busto',
  'Tórax',
  'Cintura',
  'Quadril',
  'Gancho',
  'Gancho frontal',
  'Gancho traseiro',
  'Entrepernas',
  'Coxa',
  'Joelho',
  'Barra',
  'Boca da barra',
  'Punho',
  'Gola',
  'Decote',
  'Costas',
  'Palmilha',
  'Largura da palmilha',
  'Altura do cano',
  'Circunferência',
  'Circunferência do cano',
  'Diâmetro',
  'Salto',
  'Plataforma',
  'Alça',
] as const

const EMPTY_ROW: MeasurementRow = { type: '', value: '' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createInitialStampFields() {
  return ['']
}

function getVariationSectionMeta(
  variationType: ProductRequestVariationType,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (variationType === 'variados') {
    return {
      title: t('productRequest.listAssorted'),
      description: t('productRequest.assortedDescription'),
      placeholder: t('productRequest.assortedPlaceholder'),
    }
  }

  return {
    title: t('productRequest.listStamps'),
    description: t('productRequest.stampsDescription'),
    placeholder: t('productRequest.stampsPlaceholder'),
  }
}

function ensureTrailingEmptyField(values: string[]) {
  const nextValues = [...values]

  if (nextValues.length === 0 || nextValues[nextValues.length - 1].trim()) {
    nextValues.push('')
  }

  return nextValues
}

function ensureTrailingEmptyRow(rows: MeasurementRow[]): MeasurementRow[] {
  const next = [...rows]
  const last = next[next.length - 1]

  if (!last || last.value.trim()) {
    next.push({ ...EMPTY_ROW })
  }

  return next
}

function uniqueTrimmed(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function buildSizeChartEntries(
  sizes: string[],
  sectionsBySize: SizeMeasurementMap,
  hasInferior: boolean,
): ProductRequestSizeMeasureEntry[] {
  return sizes.flatMap((size) => {
    const sections = sectionsBySize[size]
    if (!sections) return []

    const superiorEntries: ProductRequestSizeMeasureEntry[] = sections.superior
      .filter((row) => row.value.trim())
      .map((row) => ({
        size,
        measurement: row.type ? `${row.type}: ${row.value.trim()}` : row.value.trim(),
        ...(hasInferior ? { section: 'superior' as const } : {}),
      }))

    const inferiorEntries: ProductRequestSizeMeasureEntry[] = hasInferior
      ? sections.inferior
          .filter((row) => row.value.trim())
          .map((row) => ({
            size,
            measurement: row.type ? `${row.type}: ${row.value.trim()}` : row.value.trim(),
            section: 'inferior' as const,
          }))
      : []

    return [...superiorEntries, ...inferiorEntries]
  })
}

function initSizeSections(existing?: SizeSections): SizeSections {
  return {
    superior: existing?.superior?.length ? existing.superior : [{ ...EMPTY_ROW }],
    inferior: existing?.inferior?.length ? existing.inferior : [{ ...EMPTY_ROW }],
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NewProductRequestModal({ open, account, onClose, onCreated, onSuccessMessage }: NewProductRequestModalProps) {
  const t = useTranslations()
  const { locale } = useLocale()
  const { addFormRequest } = useRequestQueue()
  const [options, setOptions] = useState<ProductRequestOptions>(EMPTY_OPTIONS)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [alertMessage, setAlertMessage] = useState('')
  const [createdRequest, setCreatedRequest] = useState<ProductRequestRecord | null>(null)
  const [store, setStore] = useState('')
  const [productName, setProductName] = useState('')
  const [productCost, setProductCost] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sizeMeasurements, setSizeMeasurements] = useState<SizeMeasurementMap>({})
  const [hasInferiorSection, setHasInferiorSection] = useState(false)
  const [expandedSizeGroups, setExpandedSizeGroups] = useState<Record<string, boolean>>({})
  const [variationType, setVariationType] = useState<ProductRequestVariationType>('cores')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [stampFields, setStampFields] = useState<string[]>(createInitialStampFields())
  const [notes, setNotes] = useState('')
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(window.navigator.userAgent)
    setIsMobile(mobile)
  }, [])

  useEffect(() => {
    if (!open || !account) {
      return
    }

    let cancelled = false
    const fallbackStore = account.access.lojas[0] || ''

    async function loadOptions() {
      setLoadingOptions(true)
      setFeedback(null)

      try {
        const response = await fetch('/api/solicitacoes-produto', { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao carregar opcoes da solicitacao')
        }

        if (cancelled) {
          return
        }

        const nextOptions = payload.data as ProductRequestOptions
        setOptions(nextOptions)
        setStore((currentStore) => currentStore || nextOptions.defaultStore || nextOptions.stores[0] || fallbackStore)
      } catch (error) {
        if (cancelled) {
          return
        }

        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Falha ao carregar opcoes da solicitacao',
        })
        setAlertMessage(error instanceof Error ? error.message : 'Falha ao carregar opcoes da solicitacao')
      } finally {
        if (!cancelled) {
          setLoadingOptions(false)
        }
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [account, open])

  useEffect(() => {
    if (!open) {
      return
    }

    setExpandedSizeGroups((current) => {
      if (Object.keys(current).length > 0) {
        return current
      }

      return {
        adulto: true,
        infantil: false,
        sapato: false,
      }
    })
  }, [open])

  useEffect(() => {
    if (variationType === 'cores') {
      setStampFields(createInitialStampFields())
      return
    }

    setSelectedColors([])
  }, [variationType])

  const filledStampFields = useMemo(() => uniqueTrimmed(stampFields), [stampFields])
  const variationSectionMeta = useMemo(() => getVariationSectionMeta(variationType, t), [t, variationType])
  const orderedSelectedSizes = useMemo(() => {
    const orderedCodes = options.sizeGroups.flatMap((group) => group.items.map((item) => item.code))
    return orderedCodes.filter((code) => selectedSizes.includes(code))
  }, [options.sizeGroups, selectedSizes])

  // Sincroniza sizeMeasurements com os tamanhos selecionados
  useEffect(() => {
    setSizeMeasurements((current) => {
      const prevKeys = Object.keys(current).sort().join(',')
      const nextKeys = [...orderedSelectedSizes].sort().join(',')

      if (prevKeys === nextKeys) return current

      const nextEntries: SizeMeasurementMap = {}
      for (const size of orderedSelectedSizes) {
        nextEntries[size] = initSizeSections(current[size])
      }
      return nextEntries
    })
  }, [orderedSelectedSizes])

  if (!open || !account) {
    return null
  }

  const fallbackStore = account.access.lojas[0] || ''

  function resetForm() {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    setCreatedRequest(null)
    setFeedback(null)
    setAlertMessage('')
    setProductName('')
    setProductCost('')
    setSelectedSizes([])
    setSizeMeasurements({})
    setHasInferiorSection(false)
    setExpandedSizeGroups({})
    setVariationType('cores')
    setSelectedColors([])
    setStampFields(createInitialStampFields())
    setNotes('')
    setSelectedImages([])
    setStore(options.defaultStore || options.stores[0] || fallbackStore)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function toggleSize(size: string) {
    setSelectedSizes((current) => (current.includes(size) ? current.filter((item) => item !== size) : [...current, size]))
  }

  function toggleSizeGroup(groupId: string) {
    setExpandedSizeGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }))
  }

  function handleMeasurementChange(
    size: string,
    section: 'superior' | 'inferior',
    index: number,
    field: 'type' | 'value',
    newValue: string,
  ) {
    setSizeMeasurements((current) => {
      const currentSections = current[size] ?? initSizeSections()
      const currentRows = [...(currentSections[section] ?? [{ ...EMPTY_ROW }])]
      currentRows[index] = { ...currentRows[index], [field]: newValue }

      // Auto-adiciona linha vazia ao digitar no último campo de valor
      const updatedRows = field === 'value' ? ensureTrailingEmptyRow(currentRows) : currentRows

      return {
        ...current,
        [size]: { ...currentSections, [section]: updatedRows },
      }
    })
  }

  function addInferiorSection() {
    setSizeMeasurements((current) => {
      const next = { ...current }
      for (const size of orderedSelectedSizes) {
        next[size] = {
          superior: next[size]?.superior?.length ? next[size].superior : [{ ...EMPTY_ROW }],
          inferior: next[size]?.inferior?.some((r) => r.value || r.type)
            ? next[size].inferior
            : [{ ...EMPTY_ROW }],
        }
      }
      return next
    })
    setHasInferiorSection(true)
  }

  function removeInferiorSection() {
    setHasInferiorSection(false)
    setSizeMeasurements((current) => {
      const next = { ...current }
      for (const size of Object.keys(next)) {
        next[size] = { superior: next[size].superior, inferior: [{ ...EMPTY_ROW }] }
      }
      return next
    })
  }

  function toggleColor(color: string) {
    setSelectedColors((current) => (current.includes(color) ? current.filter((item) => item !== color) : [...current, color]))
  }

  function handleStampChange(index: number, value: string) {
    setStampFields((current) => {
      const next = [...current]
      next[index] = value
      return ensureTrailingEmptyField(next)
    })
  }

  function addFiles(files: FileList | null) {
    if (!files) {
      return
    }

    const incoming = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGE_FILES)

    setSelectedImages((current) => {
      const availableSlots = Math.max(MAX_IMAGE_FILES - current.length, 0)
      const nextItems = incoming.slice(0, availableSlots).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))

      return [...current, ...nextItems]
    })
  }

  function removeImage(targetIndex: number) {
    setSelectedImages((current) => {
      const removed = current[targetIndex]
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      return current.filter((_, index) => index !== targetIndex)
    })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setFeedback(null)
    setCreatedRequest(null)

    const variations = variationType === 'cores' ? selectedColors : filledStampFields
    const sizeChartEntries = buildSizeChartEntries(orderedSelectedSizes, sizeMeasurements, hasInferiorSection)

    try {
      if (!productName.trim()) {
        throw new Error(t('productRequest.validation.title'))
      }

      if (!productCost.trim()) {
        throw new Error(t('productRequest.validation.cost'))
      }

      if (selectedImages.length === 0) {
        throw new Error(t('productRequest.validation.images'))
      }

      const fields: Record<string, string> = {
        store,
        productName,
        productCost,
        sizes: JSON.stringify(orderedSelectedSizes),
        sizeChartEntries: JSON.stringify(sizeChartEntries),
        variationType,
        variations: JSON.stringify(variations),
        notes,
      }

      const rawFiles = selectedImages.map((image) => ({
        fieldName: 'images',
        file: image.file,
      }))

      const formData = new FormData()
      for (const [key, value] of Object.entries(fields)) {
        formData.set(key, value)
      }
      rawFiles.forEach(({ file }) => formData.append('images', file))

      const response = await fetch('/api/solicitacoes-produto', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao enviar solicitacao de produto')
      }

      setCreatedRequest(payload.data as ProductRequestRecord)
      onCreated?.(payload.data as ProductRequestRecord)
      onSuccessMessage?.(t('productRequest.success'))
      handleClose()
    } catch (error) {
      if (isNetworkError(error) || !navigator.onLine) {
        const fields: Record<string, string> = {
          store,
          productName,
          productCost,
          sizes: JSON.stringify(orderedSelectedSizes),
          sizeChartEntries: JSON.stringify(sizeChartEntries),
          variationType,
          variations: JSON.stringify(variations),
          notes,
        }

        await addFormRequest(
          '/api/solicitacoes-produto',
          fields,
          selectedImages.map((image) => ({ fieldName: 'images', file: image.file })),
          `Novo produto — ${productName} (${store})`,
        )

        setFeedback({
          type: 'success',
          message: 'Sem conexão. Solicitação salva e será enviada automaticamente quando a internet voltar.',
        })
        window.setTimeout(() => handleClose(), 2500)
      } else {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Falha ao enviar solicitacao de produto',
        })
        setAlertMessage(error instanceof Error ? error.message : 'Falha ao enviar solicitacao de produto')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="panel flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-[28px]">
        <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">{t('productRequest.label')}</p>
            <h2 className="font-display text-lg font-semibold text-ink sm:text-2xl">{t('productRequest.title')}</h2>
            <p className="mt-1 text-xs text-steel sm:text-sm">{account.nome}</p>
          </div>
          <button type="button" onClick={handleClose} className="brand-chip shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink">
            {t('common.close')}
          </button>
          </div>
        </div>

        <div className="brand-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:space-y-6 sm:px-6">

          {/* ── Instrução geral ───────────────────────────────────────────── */}
          <div className="rounded-2xl border border-amber/20 bg-amber/5 px-4 py-3">
            <p className="text-sm text-steel">{t('productRequest.intro')}</p>
          </div>

          {/* ── Informações básicas ───────────────────────────────────────── */}
          <section className="space-y-4 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.basicInfo')}</p>
              <p className="mt-1 text-sm text-steel">{t('productRequest.basicInfoHint')}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                {t('productRequest.store')}
                <select
                  value={store}
                  onChange={(event) => setStore(event.target.value)}
                  className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                  disabled={loadingOptions || account.role !== 'admin'}
                >
                  {options.stores.map((option) => (
                    <option key={option} value={option} className="bg-slate text-ink">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                <span>{t('productRequest.productTitle')} <span className="text-clay">*</span></span>
                <input
                  required
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                  placeholder={t('productRequest.productTitlePlaceholder')}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
              <span>{t('productRequest.productCost')} <span className="text-clay">*</span></span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={productCost}
                onChange={(event) => setProductCost(event.target.value)}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                placeholder="0,00"
              />
            </label>
          </section>

          {/* ── Tamanhos ─────────────────────────────────────────────────── */}
          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.sizes')}</p>
              <p className="mt-1 text-sm text-steel">{t('productRequest.sizesHint')}</p>
            </div>
            <div className="grid gap-4">
              {options.sizeGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleSizeGroup(group.id)}
                    className="brand-chip flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">{group.label}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                        {group.items.filter((size) => selectedSizes.includes(size.code)).length}
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 text-ink transition ${expandedSizeGroups[group.id] ? 'rotate-180' : ''}`}
                      >
                        <path d="M12 15.5l-6-6 1.4-1.4 4.6 4.6 4.6-4.6L18 9.5l-6 6z" fill="currentColor" />
                      </svg>
                    </span>
                  </button>
                  {expandedSizeGroups[group.id] ? (
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((size) => (
                        <button
                          key={`${group.id}-${size.code}`}
                          type="button"
                          onClick={() => toggleSize(size.code)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            selectedSizes.includes(size.code)
                              ? 'border border-amber/40 bg-amber/10 text-amber'
                              : 'brand-chip text-ink hover:border-amber/40 hover:text-amber'
                          }`}
                          title={size.label}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {/* ── Tabela de Medidas ─────────────────────────────────────────── */}
          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.sizeTable')}</p>
              <p className="text-sm text-steel">{t('productRequest.sizeTableDescription')}</p>
            </div>

            {orderedSelectedSizes.length > 0 ? (
              <>
                <div className="brand-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
                  {orderedSelectedSizes.map((size) => {
                    const sections = sizeMeasurements[size] ?? initSizeSections()
                    const filledCount = [
                      ...sections.superior,
                      ...(hasInferiorSection ? sections.inferior : []),
                    ].filter((row) => row.value.trim()).length

                    return (
                      <div
                        key={`measure-${size}`}
                        className="brand-chip min-w-[300px] snap-start rounded-3xl p-4 sm:min-w-[320px]"
                      >
                        {/* Cabeçalho do card */}
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">Tam. {size}</p>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-steel">
                            {t('productRequest.sizeMeasurements', { count: filledCount })}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {/* Label Superior (só aparece quando seção inferior está ativa) */}
                          {hasInferiorSection && (
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cobalt">
                              Superior
                            </p>
                          )}

                          {/* Linhas de medida — Superior */}
                          {sections.superior.map((row, index) => (
                            <div key={`sup-${index}`} className="flex gap-1.5">
                              <select
                                value={row.type}
                                onChange={(e) => handleMeasurementChange(size, 'superior', index, 'type', e.target.value)}
                                className="w-[130px] shrink-0 rounded-xl border border-white/10 bg-night/50 px-2 py-2 text-[11px] text-ink outline-none transition focus:border-amber/40 sm:w-[148px]"
                              >
                                <option value="">Medida</option>
                                {MEASURE_TYPES.map((mt) => (
                                  <option key={mt} value={mt} className="bg-slate">
                                    {mt}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={row.value}
                                onChange={(e) => handleMeasurementChange(size, 'superior', index, 'value', e.target.value)}
                                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-night/40 px-3 py-2 text-sm text-ink outline-none transition focus:border-amber/40"
                                placeholder={index === 0 ? t('productRequest.sizePlaceholderFirst') : t('productRequest.sizePlaceholderNext')}
                              />
                            </div>
                          ))}

                          {/* Seção Inferior */}
                          {hasInferiorSection && (
                            <>
                              <div className="my-1 border-t border-white/10 pt-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pine">
                                  Inferior
                                </p>
                              </div>
                              {sections.inferior.map((row, index) => (
                                <div key={`inf-${index}`} className="flex gap-1.5">
                                  <select
                                    value={row.type}
                                    onChange={(e) => handleMeasurementChange(size, 'inferior', index, 'type', e.target.value)}
                                    className="w-[130px] shrink-0 rounded-xl border border-white/10 bg-night/50 px-2 py-2 text-[11px] text-ink outline-none transition focus:border-amber/40 sm:w-[148px]"
                                  >
                                    <option value="">Medida</option>
                                    {MEASURE_TYPES.map((mt) => (
                                      <option key={mt} value={mt} className="bg-slate">
                                        {mt}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    value={row.value}
                                    onChange={(e) => handleMeasurementChange(size, 'inferior', index, 'value', e.target.value)}
                                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-night/40 px-3 py-2 text-sm text-ink outline-none transition focus:border-amber/40"
                                    placeholder={index === 0 ? t('productRequest.sizePlaceholderFirst') : t('productRequest.sizePlaceholderNext')}
                                  />
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Botão adicionar / remover seção inferior */}
                {!hasInferiorSection ? (
                  <button
                    type="button"
                    onClick={addInferiorSection}
                    className="brand-chip inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-pine/40 hover:text-pine"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-pine/50 text-[11px] font-bold text-pine">+</span>
                    Adicionar Medidas Inferiores
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={removeInferiorSection}
                    className="brand-chip inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-clay transition hover:border-clay/40"
                  >
                    <span className="text-base leading-none">✕</span>
                    Remover seção inferior
                  </button>
                )}
              </>
            ) : (
              <div className="brand-chip rounded-2xl px-4 py-3 text-sm text-steel">
                {t('productRequest.sizeEmpty')}
              </div>
            )}
          </section>

          {/* ── Variações ─────────────────────────────────────────────────── */}
          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.variationType')}</p>
              <p className="mt-1 text-sm text-steel">{t('productRequest.variationsHint')}</p>
            </div>
            <div className="rounded-3xl border border-cobalt/25 bg-cobalt/10 p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVariationType('cores')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  variationType === 'cores'
                    ? 'border border-amber/50 bg-amber/15 text-amber shadow-[0_0_20px_rgba(255,196,69,0.12)]'
                    : 'brand-chip text-ink'
                }`}
              >
                {t('productRequest.colors')}
              </button>
              <button
                type="button"
                onClick={() => setVariationType('estampas')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  variationType === 'estampas'
                    ? 'border border-amber/50 bg-amber/15 text-amber shadow-[0_0_20px_rgba(255,196,69,0.12)]'
                    : 'brand-chip text-ink'
                }`}
              >
                {t('productRequest.stamps')}
              </button>
              <button
                type="button"
                onClick={() => setVariationType('variados')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  variationType === 'variados'
                    ? 'border border-amber/50 bg-amber/15 text-amber shadow-[0_0_20px_rgba(255,196,69,0.12)]'
                    : 'brand-chip text-ink'
                }`}
              >
                {t('productRequest.assorted')}
              </button>
              </div>
            </div>

            {variationType === 'cores' ? (
              <div className="rounded-3xl border border-white/10 bg-night/30 p-3 sm:p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-steel">{t('productRequest.selectColors')}</p>
                <div className="flex flex-wrap gap-2">
                  {options.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedColors.includes(color)
                          ? 'border border-amber/40 bg-amber/10 text-amber'
                          : 'brand-chip text-ink hover:border-amber/40 hover:text-amber'
                      }`}
                    >
                      {translateColorLabel(color, locale) || color}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-night/30 p-3 sm:p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-steel">{variationSectionMeta.title}</p>
                <p className="mb-3 text-sm text-steel">{variationSectionMeta.description}</p>
                <div className="grid gap-3">
                  {stampFields.map((value, index) => (
                    <input
                      key={`stamp-${index}`}
                      value={value}
                      onChange={(event) => handleStampChange(index, event.target.value)}
                      className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                      placeholder={variationSectionMeta.placeholder}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Imagens ───────────────────────────────────────────────────── */}
          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.images')} <span className="text-clay">*</span></p>
              <p className="mt-1 text-sm text-steel">{t('productRequest.imagesHint')}</p>
            </div>
            <p className="text-sm text-steel">
              {isMobile ? t('productRequest.imagesRequired') : t('productRequest.imagesDesktop')}
            </p>

            <div className="flex flex-wrap gap-3">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
              />
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="brand-chip rounded-full px-4 py-3 text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
              >
                {t('productRequest.uploadImages')}
              </button>

              {isMobile ? (
                <>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(event) => addFiles(event.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="brand-chip rounded-full px-4 py-3 text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
                  >
                    {t('productRequest.openCamera')}
                  </button>
                </>
              ) : null}
            </div>

            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {selectedImages.map((image, index) => (
                  <div key={`${image.file.name}-${index}`} className="brand-chip rounded-2xl p-3">
                    <div className="relative h-28 overflow-hidden rounded-2xl border border-white/10 bg-night/50 sm:h-36">
                      <Image src={image.previewUrl} alt={image.file.name} fill className="object-cover" unoptimized />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-xs text-steel">{image.file.name}</p>
                      <button type="button" onClick={() => removeImage(index)} className="text-xs font-semibold text-clay">
                        {t('productRequest.removeImage')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* ── Material / Observações ────────────────────────────────────── */}
          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.material')}</p>
              <p className="mt-1 text-sm text-steel">{t('productRequest.materialHint')}</p>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="brand-chip w-full rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              placeholder={t('productRequest.materialPlaceholder')}
            />
          </section>

          {feedback ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                feedback.type === 'success' ? 'border border-pine/30 bg-pine/10 text-pine' : 'border border-clay/30 bg-clay/10 text-clay'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {createdRequest ? (
            <div className="rounded-2xl border border-cobalt/25 bg-cobalt/10 px-4 py-4 text-sm text-ink">
              <p className="font-semibold">Solicitacao {createdRequest.id} criada.</p>
              <p className="mt-1 text-steel">Pasta das imagens:</p>
              <Link href={createdRequest.folderUrl} target="_blank" className="mt-2 inline-flex text-sm font-semibold text-amber underline-offset-4 hover:underline">
                Abrir pasta no Drive
              </Link>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6 sm:py-4">
          <div className="grid gap-3 sm:flex sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className="brand-chip rounded-full px-5 py-3 text-sm font-semibold text-ink">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loadingOptions}
              className="rounded-full bg-cobalt px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#418dff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t('productRequest.sending') : t('productRequest.saveRequest')}
            </button>
          </div>
        </div>
      </div>

      <LoadingOverlay open={loadingOptions || submitting} label={loadingOptions ? t('productRequest.loadingForm') : t('productRequest.sendingRequest')} />
      <AlertModal
        open={Boolean(alertMessage)}
        title={t('alerts.requestFailure')}
        message={alertMessage}
        buttonLabel={t('alerts.close')}
        onClose={() => setAlertMessage('')}
      />
    </div>
  )
}

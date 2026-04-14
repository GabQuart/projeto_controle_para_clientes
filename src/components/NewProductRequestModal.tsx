'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertModal } from '@/components/AlertModal'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider'
import { translateColorLabel } from '@/lib/i18n/content'
import type { UserAccount } from '@/types/account'
import type {
  ProductRequestOptions,
  ProductRequestRecord,
  ProductRequestSizeMeasureEntry,
  ProductRequestVariationType,
} from '@/types/product-request'

type SelectedImage = {
  file: File
  previewUrl: string
}

type SizeMeasurementMap = Record<string, string[]>

type NewProductRequestModalProps = {
  open: boolean
  account: UserAccount | null
  onClose: () => void
  onCreated?: (request: ProductRequestRecord) => void
  onSuccessMessage?: (message: string) => void
}

const MAX_IMAGE_FILES = 8

const EMPTY_OPTIONS: ProductRequestOptions = {
  sizeGroups: [],
  colors: [],
  stores: [],
}

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

function uniqueTrimmed(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function buildSizeChartEntries(sizes: string[], valuesBySize: SizeMeasurementMap): ProductRequestSizeMeasureEntry[] {
  return sizes.flatMap((size) =>
    (valuesBySize[size] ?? [])
      .map((value) => value.trim())
      .filter(Boolean)
      .map((measurement) => ({
        size,
        measurement,
      })),
  )
}

export function NewProductRequestModal({ open, account, onClose, onCreated, onSuccessMessage }: NewProductRequestModalProps) {
  const t = useTranslations()
  const { locale } = useLocale()
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

  useEffect(() => {
    setSizeMeasurements((current) => {
      const nextEntries = Object.fromEntries(
        orderedSelectedSizes.map((size) => {
          const existing = current[size] ?? ['']
          return [size, ensureTrailingEmptyField(existing)]
        }),
      )

      const currentKeys = Object.keys(current)
      const nextKeys = Object.keys(nextEntries)
      const isSameShape =
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => {
          const currentValues = current[key] ?? []
          const nextValues = nextEntries[key] ?? []
          return currentValues.length === nextValues.length && currentValues.every((value, index) => value === nextValues[index])
        })

      return isSameShape ? current : nextEntries
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

  function handleSizeMeasurementChange(size: string, index: number, value: string) {
    setSizeMeasurements((current) => {
      const currentValues = [...(current[size] ?? [''])]
      currentValues[index] = value

      return {
        ...current,
        [size]: ensureTrailingEmptyField(currentValues),
      }
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

    try {
      const variations = variationType === 'cores' ? selectedColors : filledStampFields
      const sizeChartEntries = buildSizeChartEntries(orderedSelectedSizes, sizeMeasurements)

      if (!productName.trim()) {
        throw new Error(t('productRequest.validation.title'))
      }

      if (!productCost.trim()) {
        throw new Error(t('productRequest.validation.cost'))
      }

      if (selectedSizes.length === 0) {
        throw new Error(t('productRequest.validation.sizes'))
      }

      if (selectedImages.length === 0) {
        throw new Error(t('productRequest.validation.images'))
      }

      const missingMeasurements = orderedSelectedSizes.filter(
        (size) => !sizeChartEntries.some((entry) => entry.size === size && entry.measurement),
      )

      if (missingMeasurements.length > 0) {
        throw new Error(`Preencha a tabela de medidas para: ${missingMeasurements.join(', ')}.`)
      }

      const formData = new FormData()
      formData.set('store', store)
      formData.set('productName', productName)
      formData.set('productCost', productCost)
      formData.set('sizes', JSON.stringify(orderedSelectedSizes))
      formData.set('sizeChartEntries', JSON.stringify(sizeChartEntries))
      formData.set('variationType', variationType)
      formData.set('variations', JSON.stringify(variations))
      formData.set('notes', notes)

      selectedImages.forEach((image) => {
        formData.append('images', image.file)
      })

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
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao enviar solicitacao de produto',
      })
      setAlertMessage(error instanceof Error ? error.message : 'Falha ao enviar solicitacao de produto')
    } finally {
      setSubmitting(false)
    }
  }

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
              {t('productRequest.productTitle')} <span className="text-clay">*</span>
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
            {t('productRequest.productCost')} <span className="text-clay">*</span>
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

          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.sizes')} <span className="text-clay">*</span></p>
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

          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.sizeTable')}</p>
              <p className="text-sm text-steel">{t('productRequest.sizeTableDescription')}</p>
            </div>

            {orderedSelectedSizes.length > 0 ? (
              <div className="brand-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
                {orderedSelectedSizes.map((size) => (
                  <div
                    key={`measure-${size}`}
                    className="brand-chip min-w-[220px] snap-start rounded-3xl p-4 sm:min-w-[240px]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">Tam. {size}</p>
                      <span className="text-[11px] uppercase tracking-[0.14em] text-steel">
                        {t('productRequest.sizeMeasurements', { count: sizeMeasurements[size]?.filter((value) => value.trim()).length || 0 })}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3">
                      {(sizeMeasurements[size] ?? ['']).map((value, index) => (
                        <input
                          key={`${size}-${index}`}
                          value={value}
                          onChange={(event) => handleSizeMeasurementChange(size, index, event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-night/40 px-4 py-3 text-base text-ink outline-none transition focus:border-amber/40 sm:text-sm"
                          placeholder={index === 0 ? t('productRequest.sizePlaceholderFirst') : t('productRequest.sizePlaceholderNext')}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="brand-chip rounded-2xl px-4 py-3 text-sm text-steel">
                {t('productRequest.sizeEmpty')}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <div className="rounded-3xl border border-cobalt/25 bg-cobalt/10 p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">{t('productRequest.variationType')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
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

          <section className="space-y-3 rounded-3xl border border-white/10 p-3.5 sm:p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('productRequest.images')} <span className="text-clay">*</span></p>
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

          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
            {t('productRequest.material')}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              placeholder={t('productRequest.materialPlaceholder')}
            />
          </label>

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

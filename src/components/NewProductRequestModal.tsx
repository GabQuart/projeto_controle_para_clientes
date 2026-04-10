'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertModal } from '@/components/AlertModal'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import type { UserAccount } from '@/types/account'
import type { ProductRequestOptions, ProductRequestRecord, ProductRequestVariationType } from '@/types/product-request'

type SelectedImage = {
  file: File
  previewUrl: string
}

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

export function NewProductRequestModal({ open, account, onClose, onCreated, onSuccessMessage }: NewProductRequestModalProps) {
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
  const [sizeChart, setSizeChart] = useState('')
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
    if (variationType === 'cores') {
      setStampFields(createInitialStampFields())
      return
    }

    setSelectedColors([])
  }, [variationType])

  const filledStampFields = useMemo(() => uniqueTrimmed(stampFields), [stampFields])

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
    setSizeChart('')
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

      const formData = new FormData()
      formData.set('store', store)
      formData.set('productName', productName)
      formData.set('productCost', productCost)
      formData.set('sizes', JSON.stringify(selectedSizes))
      formData.set('sizeChart', sizeChart)
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
      onSuccessMessage?.('Solicitacao registrada com sucesso.')
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
      <div className="panel flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">Novo produto</p>
            <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">Solicitacao de cadastro</h2>
            <p className="mt-1 text-sm text-steel">{account.nome}</p>
          </div>
          <button type="button" onClick={handleClose} className="brand-chip shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink">
            Fechar
          </button>
        </div>

        <div className="brand-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
              Loja
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
              Nome do produto
              <input
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                placeholder="Digite o nome do produto"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
            Custo do produto
            <input
              type="number"
              min="0"
              step="0.01"
              value={productCost}
              onChange={(event) => setProductCost(event.target.value)}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              placeholder="0,00"
            />
          </label>

          <section className="space-y-3 rounded-3xl border border-white/10 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">Tamanhos</p>
            <div className="grid gap-4">
              {options.sizeGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">{group.label}</p>
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
                </div>
              ))}
            </div>
          </section>

          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
            Tabela de medidas
            <textarea
              value={sizeChart}
              onChange={(event) => setSizeChart(event.target.value)}
              rows={5}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              placeholder="Descreva as medidas do produto"
            />
          </label>

          <section className="space-y-3 rounded-3xl border border-white/10 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">Variacoes</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVariationType('cores')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  variationType === 'cores' ? 'border border-amber/40 bg-amber/10 text-amber' : 'brand-chip text-ink'
                }`}
              >
                Cores
              </button>
              <button
                type="button"
                onClick={() => setVariationType('estampas')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  variationType === 'estampas' ? 'border border-amber/40 bg-amber/10 text-amber' : 'brand-chip text-ink'
                }`}
              >
                Estampas
              </button>
            </div>

            {variationType === 'cores' ? (
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
                    {color}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {stampFields.map((value, index) => (
                  <input
                    key={`stamp-${index}`}
                    value={value}
                    onChange={(event) => handleStampChange(index, event.target.value)}
                    className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                    placeholder="Ex.: Floral / Azul"
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-3xl border border-white/10 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">Imagens</p>
            <p className="text-sm text-steel">
              {isMobile ? 'No celular voce pode enviar imagens da galeria ou abrir a camera.' : 'No computador envie as imagens do produto.'}
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
                Enviar imagens
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
                    Abrir camera
                  </button>
                </>
              ) : null}
            </div>

            {selectedImages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {selectedImages.map((image, index) => (
                  <div key={`${image.file.name}-${index}`} className="brand-chip rounded-2xl p-3">
                    <div className="relative h-36 overflow-hidden rounded-2xl border border-white/10 bg-night/50">
                      <Image src={image.previewUrl} alt={image.file.name} fill className="object-cover" unoptimized />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-xs text-steel">{image.file.name}</p>
                      <button type="button" onClick={() => removeImage(index)} className="text-xs font-semibold text-clay">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
            Observacoes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              placeholder="Campo opcional"
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

        <div className="border-t border-white/10 px-4 py-4 sm:px-6">
          <div className="grid gap-3 sm:flex sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className="brand-chip rounded-full px-5 py-3 text-sm font-semibold text-ink">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loadingOptions}
              className="rounded-full bg-cobalt px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#418dff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Salvar solicitacao'}
            </button>
          </div>
        </div>
      </div>

      <LoadingOverlay open={loadingOptions || submitting} label={loadingOptions ? 'Carregando formulario...' : 'Enviando solicitacao...'} />
      <AlertModal
        open={Boolean(alertMessage)}
        title="Falha na solicitacao"
        message={alertMessage}
        buttonLabel="Entendi"
        onClose={() => setAlertMessage('')}
      />
    </div>
  )
}

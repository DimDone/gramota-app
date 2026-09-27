// Выгрузка / загрузка шаблона списка документов (JSON).

import { DEFAULT_CERTIFICATE_NAME } from './certificateName'
import { BACKGROUND_THEMES } from './backgrounds/themes'
import {
  clampFontSizePt,
  clampMarginMm,
  type PageMarginsMm,
} from './pageGeometry'
import {
  createApprover,
  MAX_APPROVERS,
  type Approver,
  type Certificate,
  type DocumentKind,
  type FontSectionId,
  type Orientation,
  type SharedCertificateParams,
} from './types'

export const TEMPLATE_FORMAT = 'gramota-app'
export const TEMPLATE_VERSION = 1
export const TEMPLATE_FILE_NAME = 'Грамоты.json'
export const TEMPLATE_MIME = 'application/json'

const FONT_KEYS: FontSectionId[] = [
  'organization',
  'documentType',
  'documentVerb',
  'approved',
  'cityYear',
  'recipientName',
  'recipientInfo',
  'eventInfo',
]

const BACKGROUND_IDS = new Set<string>(
  BACKGROUND_THEMES.map((theme) => theme.id),
)

export type TemplateFile = {
  format: typeof TEMPLATE_FORMAT
  version: typeof TEMPLATE_VERSION
  shared: SharedCertificateParams
  documents: TemplateDocument[]
}

/** Элемент списка в файле (без id/name — они создаются при загрузке). */
export type TemplateDocument = {
  recipientName: string
  recipientInfo: string
  place: number | null
  degree: 1 | 2 | 3 | 4 | 5 | null
  eventInfo: string
}

export type ParseTemplateSuccess = {
  ok: true
  shared: SharedCertificateParams
  certificates: Certificate[]
}

export type ParseTemplateFailure = {
  ok: false
  reason: 'empty' | 'signature' | 'no-documents'
}

export type ParseTemplateResult = ParseTemplateSuccess | ParseTemplateFailure

/** Собирает JSON-шаблон из текущего состояния приложения. */
export function buildTemplateFile(
  shared: SharedCertificateParams,
  certificates: Certificate[],
): TemplateFile {
  return {
    format: TEMPLATE_FORMAT,
    version: TEMPLATE_VERSION,
    shared: {
      ...shared,
      approvers: shared.approvers.map((item) => ({ ...item })),
      marginsMm: { ...shared.marginsMm },
      fontSizesPt: { ...shared.fontSizesPt },
    },
    documents: certificates.map((item) => ({
      recipientName: item.recipientName,
      recipientInfo: item.recipientInfo,
      place: item.place,
      degree: item.degree,
      eventInfo: item.eventInfo,
    })),
  }
}

export function serializeTemplate(template: TemplateFile): string {
  return `${JSON.stringify(template, null, 2)}\n`
}

/** Разбор и валидация файла шаблона. */
export function parseTemplateFile(raw: string): ParseTemplateResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, reason: 'empty' }
  }

  let data: unknown
  try {
    data = JSON.parse(trimmed)
  } catch {
    return { ok: false, reason: 'signature' }
  }

  if (!isPlainObject(data)) {
    return { ok: false, reason: 'signature' }
  }

  if (data.format !== TEMPLATE_FORMAT || data.version !== TEMPLATE_VERSION) {
    return { ok: false, reason: 'signature' }
  }

  if (!('shared' in data) || !('documents' in data)) {
    return { ok: false, reason: 'signature' }
  }

  const shared = parseShared(data.shared)
  if (!shared) {
    return { ok: false, reason: 'signature' }
  }

  if (!Array.isArray(data.documents)) {
    return { ok: false, reason: 'signature' }
  }

  if (data.documents.length === 0) {
    return { ok: false, reason: 'no-documents' }
  }

  const certificates: Certificate[] = []
  for (const entry of data.documents) {
    const parsed = parseDocumentEntry(entry, shared.documentKind)
    if (parsed) certificates.push(parsed)
  }

  if (certificates.length === 0) {
    return { ok: false, reason: 'no-documents' }
  }

  return { ok: true, shared, certificates }
}

function parseShared(value: unknown): SharedCertificateParams | null {
  if (!isPlainObject(value)) return null

  const requiredKeys = [
    'orientation',
    'backgroundId',
    'marginsMm',
    'documentKind',
    'organization',
    'approvers',
    'city',
    'year',
    'fontSizesPt',
  ] as const
  for (const key of requiredKeys) {
    if (!(key in value)) return null
  }

  // Тип документа обязателен и должен быть gramota | diplom
  if (value.documentKind !== 'gramota' && value.documentKind !== 'diplom') {
    return null
  }
  const documentKind = value.documentKind as DocumentKind

  const orientation: Orientation | null =
    value.orientation === 'portrait' || value.orientation === 'landscape'
      ? value.orientation
      : null
  if (!orientation) return null

  const backgroundId =
    typeof value.backgroundId === 'string' &&
    BACKGROUND_IDS.has(value.backgroundId)
      ? value.backgroundId
      : 'none'

  const marginsMm = parseMargins(value.marginsMm)
  if (!marginsMm) return null

  if (typeof value.organization !== 'string') return null
  if (typeof value.city !== 'string') return null
  if (typeof value.year !== 'string') return null

  const fontSizesPt = parseFontSizes(value.fontSizesPt)
  if (!fontSizesPt) return null

  const approvers = parseApprovers(value.approvers)
  if (!approvers) return null

  return {
    orientation,
    backgroundId,
    marginsMm,
    documentKind,
    organization: value.organization,
    approvers,
    city: value.city,
    year: value.year.replace(/[^\d]/g, '').slice(0, 4),
    fontSizesPt,
  }
}

/**
 * Элемент списка. Невалидный documentKind у элемента — пропускаем.
 * place/degree вне диапазона — clamp к допустимому максимуму/минимуму.
 */
function parseDocumentEntry(
  value: unknown,
  sharedKind: DocumentKind,
): Certificate | null {
  if (!isPlainObject(value)) return null

  const keys = [
    'recipientName',
    'recipientInfo',
    'place',
    'degree',
    'eventInfo',
  ] as const
  for (const key of keys) {
    if (!(key in value)) return null
  }

  // Если у элемента указан свой тип — невалидный пропускаем
  if ('documentKind' in value && value.documentKind != null) {
    if (value.documentKind !== 'gramota' && value.documentKind !== 'diplom') {
      return null
    }
  }

  if (typeof value.recipientName !== 'string') return null
  if (typeof value.recipientInfo !== 'string') return null
  if (typeof value.eventInfo !== 'string') return null

  const place = clampPlace(value.place)
  const degree = clampDegree(value.degree)

  const recipientName = value.recipientName.trim()
  const name = recipientName || DEFAULT_CERTIFICATE_NAME

  return {
    id: crypto.randomUUID(),
    name,
    recipientName: value.recipientName,
    recipientInfo: value.recipientInfo,
    place: sharedKind === 'gramota' ? place : null,
    degree: sharedKind === 'diplom' ? degree : null,
    eventInfo: value.eventInfo,
  }
}

function clampPlace(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n)
  if (rounded < 1) return 1
  if (rounded > 10) return 10
  return rounded
}

function clampDegree(value: unknown): 1 | 2 | 3 | 4 | 5 | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n)
  if (rounded < 1) return 1
  if (rounded > 5) return 5
  return rounded as 1 | 2 | 3 | 4 | 5
}

function parseMargins(value: unknown): PageMarginsMm | null {
  if (!isPlainObject(value)) return null
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    if (!(side in value) || typeof value[side] !== 'number') return null
  }
  return {
    top: clampMarginMm(value.top as number),
    right: clampMarginMm(value.right as number),
    bottom: clampMarginMm(value.bottom as number),
    left: clampMarginMm(value.left as number),
  }
}

function parseFontSizes(
  value: unknown,
): Record<FontSectionId, number> | null {
  if (!isPlainObject(value)) return null
  const result = {} as Record<FontSectionId, number>
  for (const key of FONT_KEYS) {
    if (!(key in value) || typeof value[key] !== 'number') return null
    result[key] = clampFontSizePt(value[key] as number)
  }
  return result
}

function parseApprovers(value: unknown): Approver[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const list: Approver[] = []
  for (const item of value.slice(0, MAX_APPROVERS)) {
    if (!isPlainObject(item)) return null
    if (typeof item.title !== 'string' || typeof item.name !== 'string') {
      return null
    }
    list.push({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      title: item.title,
      name: item.name,
    })
  }
  return list.length > 0 ? list : [createApprover()]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Сохранение JSON через File System Access API или скачивание. */
export async function exportTemplateJson(content: string): Promise<void> {
  const blob = new Blob([content], { type: TEMPLATE_MIME })
  const savePicker = window.showSaveFilePicker

  if (savePicker) {
    try {
      const handle = await savePicker({
        suggestedName: TEMPLATE_FILE_NAME,
        types: [
          {
            description: 'JSON',
            accept: { [TEMPLATE_MIME]: ['.json'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if (isAbortError(error)) return
      // fallback ниже
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = TEMPLATE_FILE_NAME
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Выбор и чтение JSON-файла. null — пользователь отменил. */
export async function pickTemplateJsonFile(): Promise<string | null> {
  const openPicker = window.showOpenFilePicker

  if (openPicker) {
    try {
      const [handle] = await openPicker({
        multiple: false,
        types: [
          {
            description: 'JSON',
            accept: { [TEMPLATE_MIME]: ['.json'] },
          },
        ],
      })
      const file = await handle.getFile()
      return await file.text()
    } catch (error) {
      if (isAbortError(error)) return null
      // fallback ниже
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      void file.text().then(resolve, () => resolve(null))
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  )
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
    }) => Promise<FileSystemFileHandle>

    showOpenFilePicker?: (options?: {
      multiple?: boolean
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
    }) => Promise<FileSystemFileHandle[]>
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>
    getFile(): Promise<File>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | string): Promise<void>
    close(): Promise<void>
  }
}

// Общие типы данных приложения.

import type { PageMarginsMm } from './pageGeometry'

export type Orientation = 'portrait' | 'landscape'

export type Certificate = {
  id: string
  name: string
}

/** Вид документа в шапке грамоты. */
export type DocumentKind = 'gramota' | 'diplom'

/**
 * Блоки общего текста на листе.
 * Порядок в массиве = порядок на панели и в документе.
 */
export type CommonTextBlockId =
  | 'documentType'
  | 'organization'
  | 'approved'
  | 'cityYear'

export type Approver = {
  id: string
  title: string
  name: string
}

export type SharedCertificateParams = {
  orientation: Orientation
  /** Заглушка: выбор фона пока не влияет на превью. */
  backgroundId: string
  /** Поля листа в миллиметрах (A4). */
  marginsMm: PageMarginsMm
  documentKind: DocumentKind
  organization: string
  approvers: Approver[]
  city: string
  year: string
  textBlockOrder: CommonTextBlockId[]
  /** Кегль каждой секции, пункты (pt). */
  fontSizesPt: Record<CommonTextBlockId, number>
}

export const DEFAULT_TEXT_BLOCK_ORDER: CommonTextBlockId[] = [
  'documentType',
  'organization',
  'approved',
  'cityYear',
]

export const MAX_APPROVERS = 5

export function createApprover(): Approver {
  return {
    id: crypto.randomUUID(),
    title: '',
    name: '',
  }
}

export function createDefaultSharedParams(): SharedCertificateParams {
  return {
    orientation: 'portrait',
    backgroundId: 'none',
    marginsMm: { top: 20, right: 15, bottom: 20, left: 15 },
    documentKind: 'gramota',
    organization: '',
    approvers: [createApprover()],
    city: '',
    year: '',
    textBlockOrder: [...DEFAULT_TEXT_BLOCK_ORDER],
    fontSizesPt: {
      documentType: 28,
      organization: 14,
      approved: 12,
      cityYear: 12,
    },
  }
}

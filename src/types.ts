// Общие типы данных приложения.

import type { PageMarginsMm } from './pageGeometry'

export type Orientation = 'portrait' | 'landscape'

/** Уникальные поля одной грамоты/диплома. */
export type Certificate = {
  id: string
  name: string
  /** ФИО награждаемого (валидация как у названия грамоты). */
  recipientName: string
  /** Доп. информация о награждаемом (необязательный многострочный текст). */
  recipientInfo: string
  /** Грамота: место (опционально). */
  place: number | null
  /** Диплом: степень 1–5 (опционально). */
  degree: 1 | 2 | 3 | 4 | 5 | null
  /** Информация о мероприятии. */
  eventInfo: string
}

export type DocumentKind = 'gramota' | 'diplom'

export type FontSectionId =
  | 'organization'
  | 'documentType'
  | 'documentVerb'
  | 'approved'
  | 'cityYear'
  | 'recipientName'
  | 'recipientInfo'
  | 'eventInfo'

export type Approver = {
  id: string
  title: string
  name: string
}

/** Запас места на листе: можно ли наращивать текст / добавлять утверждающих. */
export type LayoutCapacity = {
  freeGapPx: number
  canExpandText: boolean
  canAddApprover: boolean
}

export type SharedCertificateParams = {
  orientation: Orientation
  backgroundId: string
  marginsMm: PageMarginsMm
  documentKind: DocumentKind
  organization: string
  approvers: Approver[]
  city: string
  year: string
  fontSizesPt: Record<FontSectionId, number>
}

export const MAX_APPROVERS = 5

/** Минимальный суммарный зазор spacer'ов (px), ниже — блоки соприкасаются. */
export const LAYOUT_GAP_MIN_PX = 10

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  gramota: 'Грамота',
  diplom: 'Диплом',
}

export const DOCUMENT_VERB_LABEL: Record<DocumentKind, string> = {
  gramota: 'награждается',
  diplom: 'вручается',
}

export const ROMAN_DEGREE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
}

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
    marginsMm: { top: 36, right: 15, bottom: 20, left: 15 },
    documentKind: 'gramota',
    organization: '',
    approvers: [createApprover()],
    city: '',
    year: '',
    fontSizesPt: {
      organization: 14,
      documentType: 28,
      documentVerb: 14,
      approved: 12,
      cityYear: 12,
      recipientName: 16,
      recipientInfo: 14,
      eventInfo: 13,
    },
  }
}

export const DEFAULT_LAYOUT_CAPACITY: LayoutCapacity = {
  freeGapPx: Number.POSITIVE_INFINITY,
  canExpandText: true,
  canAddApprover: true,
}

// Геометрия листа A4: размеры, отступы в мм и оценка лимита символов в строке.

import type { Orientation } from './types'

/** ISO 216 A4 */
export const A4_MM = {
  short: 210,
  long: 297,
} as const

/** 1 типографский пункт в миллиметрах (1/72 дюйма). */
export const PT_TO_MM = 25.4 / 72

/** Средняя ширина глифа относительно кегля (кириллица/латиница). */
const AVG_CHAR_EMPIRICAL = 0.55

export type PageMarginsMm = {
  top: number
  right: number
  bottom: number
  left: number
}

export function pageSizeMm(orientation: Orientation): {
  widthMm: number
  heightMm: number
} {
  return orientation === 'portrait'
    ? { widthMm: A4_MM.short, heightMm: A4_MM.long }
    : { widthMm: A4_MM.long, heightMm: A4_MM.short }
}

export function contentWidthMm(
  orientation: Orientation,
  margins: PageMarginsMm,
): number {
  const { widthMm } = pageSizeMm(orientation)
  return Math.max(0, widthMm - margins.left - margins.right)
}

/**
 * Сколько символов умещается в одну строку при заданной ширине (мм) и кегле (pt).
 * fraction — доля ширины контента (например 0.48 для половины строки «Утвердили»).
 */
export function maxCharsPerLine(
  orientation: Orientation,
  margins: PageMarginsMm,
  fontSizePt: number,
  fraction = 1,
): number {
  const widthMm = contentWidthMm(orientation, margins) * fraction
  const charWidthMm = Math.max(fontSizePt, 1) * PT_TO_MM * AVG_CHAR_EMPIRICAL
  return Math.max(1, Math.floor(widthMm / charWidthMm))
}

export function clampMarginMm(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(80, Math.max(0, Math.round(value * 10) / 10))
}

export function clampFontSizePt(value: number): number {
  if (Number.isNaN(value)) return 12
  return Math.min(72, Math.max(8, Math.round(value)))
}

// Лист грамоты (A4): общий рендер для превью и PDF-выгрузки.

import { useLayoutEffect, useRef } from 'react'
import { CertificateBackground } from './backgrounds/CertificateBackground'
import { getBackgroundTheme } from './backgrounds/themes'
import { pageSizeMm, PT_TO_MM } from './pageGeometry'
import {
  DOCUMENT_KIND_LABEL,
  DOCUMENT_VERB_LABEL,
  LAYOUT_GAP_MIN_PX,
  MAX_APPROVERS,
  ROMAN_DEGREE,
  type Certificate,
  type FontSectionId,
  type LayoutCapacity,
  type SharedCertificateParams,
} from './types'
import './CertificatePreview.css'

export type CertificateSheetProps = {
  params: SharedCertificateParams
  certificate: Certificate
  /** Режим печати/экспорта: фиксированный размер листа без тени. */
  exportMode?: boolean
  onLayoutCapacity?: (capacity: LayoutCapacity) => void
}

export function CertificateSheet({
  params,
  certificate,
  exportMode = false,
  onLayoutCapacity,
}: CertificateSheetProps) {
  const { orientation, marginsMm, fontSizesPt, backgroundId } = params
  const { widthMm, heightMm } = pageSizeMm(orientation)
  const backgroundTheme = getBackgroundTheme(backgroundId)

  const spacerTopRef = useRef<HTMLDivElement>(null)
  const spacerBottomRef = useRef<HTMLDivElement>(null)
  const approvedRef = useRef<HTMLDivElement>(null)

  const padStyle = {
    paddingTop: `${(marginsMm.top / heightMm) * 100}%`,
    paddingRight: `${(marginsMm.right / widthMm) * 100}%`,
    paddingBottom: `${(marginsMm.bottom / heightMm) * 100}%`,
    paddingLeft: `${(marginsMm.left / widthMm) * 100}%`,
  }

  function fontStyle(section: FontSectionId) {
    const sizeMm = fontSizesPt[section] * PT_TO_MM
    return { fontSize: `${(sizeMm / widthMm) * 100}cqw` }
  }

  useLayoutEffect(() => {
    if (!onLayoutCapacity) return

    function measure() {
      const top = spacerTopRef.current?.getBoundingClientRect().height ?? 0
      const bottom =
        spacerBottomRef.current?.getBoundingClientRect().height ?? 0
      const freeGapPx = top + bottom

      const approvedH =
        approvedRef.current?.getBoundingClientRect().height ?? 24
      const rows = Math.max(1, params.approvers.length)
      const rowEstimate = approvedH / rows

      onLayoutCapacity?.({
        freeGapPx,
        canExpandText: freeGapPx > LAYOUT_GAP_MIN_PX,
        canAddApprover:
          params.approvers.length < MAX_APPROVERS &&
          freeGapPx > rowEstimate + LAYOUT_GAP_MIN_PX,
      })
    }

    measure()

    const observer = new ResizeObserver(measure)
    if (spacerTopRef.current) observer.observe(spacerTopRef.current)
    if (spacerBottomRef.current) observer.observe(spacerBottomRef.current)
    if (approvedRef.current) observer.observe(approvedRef.current)

    return () => observer.disconnect()
  }, [
    onLayoutCapacity,
    params,
    certificate,
    orientation,
    marginsMm,
    fontSizesPt,
    backgroundId,
  ])

  const cityYearText = [params.city.trim(), params.year.trim()]
    .filter(Boolean)
    .join(', ')

  const degreeLine =
    params.documentKind === 'diplom' && certificate.degree != null
      ? `${ROMAN_DEGREE[certificate.degree]} степени`
      : null

  const placeLine =
    params.documentKind === 'gramota' && certificate.place != null
      ? `за ${certificate.place} место`
      : null

  const sheetClass = [
    'preview-sheet',
    `preview-sheet--${orientation}`,
    exportMode ? 'preview-sheet--export' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={sheetClass}
      data-certificate-sheet=""
      role="img"
      aria-label={
        orientation === 'portrait'
          ? 'Грамота, вертикальная ориентация'
          : 'Грамота, горизонтальная ориентация'
      }
      style={{ backgroundColor: backgroundTheme.paper }}
    >
      <CertificateBackground
        orientation={orientation}
        theme={backgroundTheme}
      />

      <div className="preview-sheet__content" style={padStyle}>
        {/*
          Порядок блоков на листе:
          организация → вид документа → степень → глагол →
          инфо о награждаемом → ФИО → место → мероприятие →
          утвердили → город/год
        */}
        <div className="preview-sheet__top">
          {params.organization.trim() && (
            <p
              className="preview-block preview-block--organization"
              style={fontStyle('organization')}
            >
              {params.organization}
            </p>
          )}

          <div className="preview-doc-group">
            <p
              className="preview-block preview-block--documentType"
              style={fontStyle('documentType')}
            >
              {DOCUMENT_KIND_LABEL[params.documentKind]}
            </p>

            {degreeLine && (
              <p
                className="preview-block preview-block--rank"
                style={fontStyle('documentVerb')}
              >
                {degreeLine}
              </p>
            )}

            <p
              className="preview-block preview-block--documentVerb"
              style={fontStyle('documentVerb')}
            >
              {DOCUMENT_VERB_LABEL[params.documentKind]}
            </p>
          </div>

          {certificate.recipientInfo.trim() && (
            <p
              className="preview-block preview-block--recipient"
              style={fontStyle('recipientInfo')}
            >
              {certificate.recipientInfo}
            </p>
          )}

          {certificate.recipientName.trim() && (
            <p
              className="preview-block preview-block--recipientName"
              style={fontStyle('recipientName')}
            >
              {certificate.recipientName}
            </p>
          )}

          {placeLine && (
            <p
              className="preview-block preview-block--rank"
              style={fontStyle('documentVerb')}
            >
              {placeLine}
            </p>
          )}
        </div>

        <div className="preview-sheet__middle">
          <p
            className="preview-block preview-block--eventInfo"
            style={fontStyle('eventInfo')}
          >
            {certificate.eventInfo.trim() || '\u00A0'}
          </p>

          <div className="preview-sheet__balance">
            <div
              ref={spacerTopRef}
              className="preview-sheet__spacer"
              aria-hidden="true"
            />

            <div
              ref={approvedRef}
              className="preview-block preview-block--approved"
              style={fontStyle('approved')}
            >
              {params.approvers.map((item) => (
                <div key={item.id} className="preview-approver">
                  <span className="preview-approver__title">{item.title}</span>
                  <span className="preview-approver__name">{item.name}</span>
                </div>
              ))}
            </div>

            <div
              ref={spacerBottomRef}
              className="preview-sheet__spacer"
              aria-hidden="true"
            />
          </div>
        </div>

        <p
          className="preview-block preview-block--cityYear"
          style={fontStyle('cityYear')}
        >
          {cityYearText || '\u00A0'}
        </p>
      </div>
    </div>
  )
}

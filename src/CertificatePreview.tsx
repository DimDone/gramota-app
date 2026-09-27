// Поле предпросмотра грамоты (белый лист A4) с общими текстовыми блоками.

import { pageSizeMm, PT_TO_MM } from './pageGeometry'
import type { CommonTextBlockId, SharedCertificateParams } from './types'
import './CertificatePreview.css'

type CertificatePreviewProps = {
  params: SharedCertificateParams
}

const DOCUMENT_KIND_LABEL: Record<SharedCertificateParams['documentKind'], string> = {
  gramota: 'Грамота',
  diplom: 'Диплом',
}

const FOOTER_BLOCKS = new Set<CommonTextBlockId>(['approved', 'cityYear'])

export function CertificatePreview({ params }: CertificatePreviewProps) {
  const { orientation, textBlockOrder, marginsMm, fontSizesPt } = params
  const { widthMm, heightMm } = pageSizeMm(orientation)

  // Отступы (мм → % высоты/ширины A4) и кегль (pt → cqw от ширины листа)
  const padStyle = {
    paddingTop: `${(marginsMm.top / heightMm) * 100}%`,
    paddingRight: `${(marginsMm.right / widthMm) * 100}%`,
    paddingBottom: `${(marginsMm.bottom / heightMm) * 100}%`,
    paddingLeft: `${(marginsMm.left / widthMm) * 100}%`,
  }

  function fontStyle(blockId: CommonTextBlockId) {
    const sizeMm = fontSizesPt[blockId] * PT_TO_MM
    return { fontSize: `${(sizeMm / widthMm) * 100}cqw` }
  }

  // «Утвердили» и «Город и год» всегда в футере; остальные — в основной зоне
  const mainBlocks = textBlockOrder.filter((id) => !FOOTER_BLOCKS.has(id))

  const city = params.city.trim()
  const year = params.year.trim()
  const cityYearText = [city, year].filter(Boolean).join(', ')

  const approverRows = params.approvers.filter(
    (item) => item.title.trim() || item.name.trim(),
  )

  return (
    <div className="preview-anchor" aria-label="Предпросмотр грамоты">
      <div className="preview-slot">
        <div
          className={`preview-sheet preview-sheet--${orientation}`}
          role="img"
          aria-label={
            orientation === 'portrait'
              ? 'Грамота, вертикальная ориентация'
              : 'Грамота, горизонтальная ориентация'
          }
        >
          <div className="preview-sheet__content" style={padStyle}>
            {/* Верхняя зона: блоки, не привязанные к низу листа */}
            <div className="preview-sheet__main">
              {mainBlocks.map((blockId) => {
                if (blockId === 'documentType') {
                  return (
                    <p
                      key={blockId}
                      className="preview-block preview-block--documentType"
                      style={fontStyle(blockId)}
                    >
                      {DOCUMENT_KIND_LABEL[params.documentKind]}
                    </p>
                  )
                }

                if (blockId === 'organization') {
                  if (!params.organization.trim()) return null
                  return (
                    <p
                      key={blockId}
                      className="preview-block preview-block--organization"
                      style={fontStyle(blockId)}
                    >
                      {params.organization}
                    </p>
                  )
                }

                return null
              })}
            </div>

            {/* Низ листа: «Утвердили» над «Город и год»; место под город/год всегда зарезервировано */}
            <div className="preview-sheet__footer">
              <div
                className="preview-block preview-block--approved"
                style={fontStyle('approved')}
              >
                {approverRows.map((item) => (
                  <div key={item.id} className="preview-approver">
                    <span className="preview-approver__title">{item.title}</span>
                    <span className="preview-approver__name">{item.name}</span>
                  </div>
                ))}
              </div>

              <p
                className="preview-block preview-block--cityYear"
                style={fontStyle('cityYear')}
              >
                {cityYearText || '\u00A0'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

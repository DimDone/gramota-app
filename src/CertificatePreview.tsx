// Поле предпросмотра грамоты (белый лист A4) с учётом ориентации.

import type { Orientation } from './types'
import './CertificatePreview.css'

type CertificatePreviewProps = {
  orientation: Orientation
}

export function CertificatePreview({ orientation }: CertificatePreviewProps) {
  return (
    // Якорь по центру (~45% ширины): слот стабилен при смене ориентации
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
        />
      </div>
    </div>
  )
}

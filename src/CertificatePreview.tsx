// Поле предпросмотра грамоты (A4).

import { CertificateSheet } from './CertificateSheet'
import type {
  Certificate,
  LayoutCapacity,
  SharedCertificateParams,
} from './types'
import './CertificatePreview.css'

type CertificatePreviewProps = {
  params: SharedCertificateParams
  certificate: Certificate
  onLayoutCapacity?: (capacity: LayoutCapacity) => void
}

export function CertificatePreview({
  params,
  certificate,
  onLayoutCapacity,
}: CertificatePreviewProps) {
  return (
    <div className="preview-anchor" aria-label="Предпросмотр грамоты">
      <div className="preview-slot">
        <CertificateSheet
          params={params}
          certificate={certificate}
          onLayoutCapacity={onLayoutCapacity}
        />
      </div>
    </div>
  )
}

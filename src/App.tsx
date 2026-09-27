// Корневой экран: список слева, превью + общие параметры по центру, уникальные справа.

import { useCallback, useState } from 'react'
import { CertificatePreview } from './CertificatePreview'
import { CertificateList, createCertificate } from './CertificateList'
import { SharedParamsPanel } from './SharedParamsPanel'
import { SidePanel } from './SidePanel'
import { Toast, type ToastMessage } from './Toast'
import { UniqueParamsPanel } from './UniqueParamsPanel'
import {
  buildTemplateFile,
  exportTemplateJson,
  parseTemplateFile,
  pickTemplateJsonFile,
  serializeTemplate,
} from './templateFile'
import { exportCertificatesPdf } from './exportPdf'
import {
  createDefaultSharedParams,
  DEFAULT_LAYOUT_CAPACITY,
  type Certificate,
  type LayoutCapacity,
  type SharedCertificateParams,
} from './types'
import './App.css'

function App() {
  const [initialCertificate] = useState(() => createCertificate())
  const [certificates, setCertificates] = useState<Certificate[]>([
    initialCertificate,
  ])
  const [selectedId, setSelectedId] = useState(initialCertificate.id)
  const [sharedParams, setSharedParams] = useState<SharedCertificateParams>(
    createDefaultSharedParams,
  )
  const [layoutCapacity, setLayoutCapacity] = useState<LayoutCapacity>(
    DEFAULT_LAYOUT_CAPACITY,
  )
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const selectedCertificate =
    certificates.find((item) => item.id === selectedId) ?? certificates[0]

  const handleLayoutCapacity = useCallback((capacity: LayoutCapacity) => {
    setLayoutCapacity(capacity)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  function showToast(text: string, tone: ToastMessage['tone']) {
    setToast({ id: Date.now(), text, tone })
  }

  function handleAdd() {
    const next = createCertificate()
    setCertificates((prev) => [...prev, next])
    setSelectedId(next.id)
  }

  function handleRemove(id: string) {
    if (certificates.length <= 1) return
    const next = certificates.filter((item) => item.id !== id)
    setCertificates(next)
    if (selectedId === id) {
      setSelectedId(next[0].id)
    }
  }

  function handleRename(id: string, name: string) {
    setCertificates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item)),
    )
  }

  function handleUniqueChange(next: Certificate) {
    setCertificates((prev) =>
      prev.map((item) => (item.id === next.id ? next : item)),
    )
  }

  async function handleExport() {
    const template = buildTemplateFile(sharedParams, certificates)
    await exportTemplateJson(serializeTemplate(template))
  }

  async function handleImport() {
    const raw = await pickTemplateJsonFile()
    if (raw === null) return

    const result = parseTemplateFile(raw)
    if (!result.ok) {
      if (result.reason === 'empty') {
        showToast('Ошибка загрузки: файл пуст', 'error')
      } else if (result.reason === 'no-documents') {
        showToast('Ошибка загрузки: нет документов для загрузки', 'error')
      } else {
        showToast('Ошибка загрузки: файл не соответствует сигнатуре', 'error')
      }
      return
    }

    setSharedParams(result.shared)
    setCertificates(result.certificates)
    setSelectedId(result.certificates[0].id)
    showToast(`Загружено ${result.certificates.length} документов`, 'success')
  }

  async function handleExportPdf() {
    const result = await exportCertificatesPdf(sharedParams, certificates)
    if (!result.ok) {
      if (result.reason === 'cancelled') return
      showToast('Ошибка выгрузки PDF', 'error')
      return
    }
    showToast(`Выгружено ${result.count} PDF`, 'success')
  }

  return (
    <div className="app">
      <Toast message={toast} onDismiss={dismissToast} />

      <SidePanel side="left" title="Список документов о награждении">
        <CertificateList
          certificates={certificates}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onRename={handleRename}
          onExport={() => void handleExport()}
          onImport={() => void handleImport()}
          onExportPdf={() => void handleExportPdf()}
        />
      </SidePanel>

      <div className="app__center">
        <div className="app__preview">
          <CertificatePreview
            params={sharedParams}
            certificate={selectedCertificate}
            onLayoutCapacity={handleLayoutCapacity}
          />
        </div>
        <div className="app__shared">
          <SharedParamsPanel
            params={sharedParams}
            layout={layoutCapacity}
            onChange={setSharedParams}
          />
        </div>
      </div>

      <SidePanel side="right" title={selectedCertificate.name}>
        <UniqueParamsPanel
          certificate={selectedCertificate}
          documentKind={sharedParams.documentKind}
          shared={sharedParams}
          layout={layoutCapacity}
          onChange={handleUniqueChange}
        />
      </SidePanel>
    </div>
  )
}

export default App

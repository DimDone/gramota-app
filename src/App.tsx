// Корневой экран: список слева, превью + общие параметры по центру, уникальные справа.

import { useCallback, useState } from 'react'
import { CertificatePreview } from './CertificatePreview'
import { CertificateList, createCertificate } from './CertificateList'
import { SharedParamsPanel } from './SharedParamsPanel'
import { SidePanel } from './SidePanel'
import { UniqueParamsPanel } from './UniqueParamsPanel'
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

  const selectedCertificate =
    certificates.find((item) => item.id === selectedId) ?? certificates[0]

  const handleLayoutCapacity = useCallback((capacity: LayoutCapacity) => {
    setLayoutCapacity(capacity)
  }, [])

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

  return (
    <div className="app">
      <SidePanel side="left" title="Список грамот">
        <CertificateList
          certificates={certificates}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onRename={handleRename}
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

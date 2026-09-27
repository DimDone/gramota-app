// Корневой экран: список слева, превью + общие параметры по центру, уникальные справа.

import { useState } from 'react'
import { CertificatePreview } from './CertificatePreview'
import { CertificateList, createCertificate } from './CertificateList'
import { SharedParamsPanel } from './SharedParamsPanel'
import { SidePanel } from './SidePanel'
import {
  createDefaultSharedParams,
  type Certificate,
  type SharedCertificateParams,
} from './types'
import './App.css'

function App() {
  // --- Состояние: грамоты, выбор, общие параметры шаблона ---
  const [initialCertificate] = useState(() => createCertificate())
  const [certificates, setCertificates] = useState<Certificate[]>([
    initialCertificate,
  ])
  const [selectedId, setSelectedId] = useState(initialCertificate.id)
  const [sharedParams, setSharedParams] = useState<SharedCertificateParams>(
    createDefaultSharedParams,
  )

  const selectedCertificate =
    certificates.find((item) => item.id === selectedId) ?? certificates[0]

  // --- Обработчики списка грамот ---
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

  return (
    <div className="app">
      {/* Левая колонка: список грамот */}
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

      {/* Центр: превью сверху, общие параметры снизу */}
      <div className="app__center">
        <div className="app__preview">
          <CertificatePreview params={sharedParams} />
        </div>
        <div className="app__shared">
          <SharedParamsPanel params={sharedParams} onChange={setSharedParams} />
        </div>
      </div>

      {/* Правая колонка: параметры выбранной грамоты */}
      <SidePanel side="right" title={selectedCertificate.name}>
        <p className="side-panel__placeholder">
          Уникальные параметры грамоты появятся здесь позже.
        </p>
      </SidePanel>
    </div>
  )
}

export default App

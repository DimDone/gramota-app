// Корневой экран приложения: состояние грамот/ориентации и раскладка
// (переключатель ориентации, список слева, превью по центру, параметры справа).

import { useState } from 'react'
import { CertificatePreview } from './CertificatePreview'
import { CertificateList, createCertificate } from './CertificateList'
import { SidePanel } from './SidePanel'
import type { Certificate, Orientation } from './types'
import './App.css'

function App() {
  // --- Состояние: ориентация листа, список грамот, выбранная грамота ---
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [initialCertificate] = useState(() => createCertificate())
  const [certificates, setCertificates] = useState<Certificate[]>([
    initialCertificate,
  ])
  const [selectedId, setSelectedId] = useState(initialCertificate.id)

  const selectedCertificate =
    certificates.find((item) => item.id === selectedId) ?? certificates[0]

  // --- Обработчики списка грамот (добавление / удаление / переименование) ---
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
      {/* Переключатель ориентации превью */}
      <div className="orientation-controls" role="group" aria-label="Ориентация листа">
        <button
          type="button"
          className={
            orientation === 'portrait'
              ? 'orientation-controls__btn orientation-controls__btn--active'
              : 'orientation-controls__btn'
          }
          aria-pressed={orientation === 'portrait'}
          onClick={() => setOrientation('portrait')}
        >
          Вертикальная
        </button>
        <button
          type="button"
          className={
            orientation === 'landscape'
              ? 'orientation-controls__btn orientation-controls__btn--active'
              : 'orientation-controls__btn'
          }
          aria-pressed={orientation === 'landscape'}
          onClick={() => setOrientation('landscape')}
        >
          Горизонтальная
        </button>
      </div>

      {/* Левая панель: список грамот */}
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

      {/* Центральное поле предпросмотра листа */}
      <CertificatePreview orientation={orientation} />

      {/* Правая панель: параметры выбранной грамоты (заголовок = имя) */}
      <SidePanel side="right" title={selectedCertificate.name}>
        <p className="side-panel__placeholder">
          Параметры выбранной грамоты появятся здесь позже.
        </p>
      </SidePanel>
    </div>
  )
}

export default App

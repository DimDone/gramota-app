// Список грамот: выбор, добавление, удаление и inline-редактирование названия.

import { useId, useState } from 'react'
import type { Certificate } from './types'
import {
  DEFAULT_CERTIFICATE_NAME,
  filterCertificateNameInput,
  isValidCertificateName,
  MAX_CERTIFICATE_NAME_LENGTH,
} from './certificateName'
import './CertificateList.css'

type CertificateListProps = {
  certificates: Certificate[]
  selectedId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
}

// --- Иконки действий строки списка ---
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.51-2.51a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2-1.66z"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 7h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 1h4v2H4V3h4l1-1z"
      />
    </svg>
  )
}

export function CertificateList({
  certificates,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onRename,
}: CertificateListProps) {
  // --- Локальный режим редактирования названия ---
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const inputIdPrefix = useId()
  const canDelete = certificates.length > 1

  function startEditing(certificate: Certificate) {
    setEditingId(certificate.id)
    setDraftName(certificate.name)
  }

  function commitEditing(certificate: Certificate) {
    if (isValidCertificateName(draftName)) {
      onRename(certificate.id, draftName)
    }
    setEditingId(null)
    setDraftName('')
  }

  function cancelEditing() {
    setEditingId(null)
    setDraftName('')
  }

  return (
    <div className="certificate-list">
      {/* Элементы списка грамот */}
      <ul className="certificate-list__items" role="list">
        {certificates.map((certificate) => {
          const isEditing = editingId === certificate.id
          const isSelected = selectedId === certificate.id

          return (
            <li
              key={certificate.id}
              className={
                isSelected
                  ? 'certificate-list__item certificate-list__item--selected'
                  : 'certificate-list__item'
              }
            >
              {/* Ячейка имени: просмотр или поле ввода */}
              <div className="certificate-list__name-cell">
                {isEditing ? (
                  <input
                    id={`${inputIdPrefix}-${certificate.id}`}
                    className="certificate-list__name-field certificate-list__name-input"
                    value={draftName}
                    maxLength={MAX_CERTIFICATE_NAME_LENGTH}
                    autoFocus
                    aria-label="Название грамоты"
                    onChange={(event) =>
                      setDraftName(filterCertificateNameInput(event.target.value))
                    }
                    onBlur={() => commitEditing(certificate)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        commitEditing(certificate)
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        cancelEditing()
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="certificate-list__name-field certificate-list__select"
                    onClick={() => onSelect(certificate.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="certificate-list__name">{certificate.name}</span>
                  </button>
                )}
              </div>

              {/* Действия строки: редактировать / удалить */}
              <div className="certificate-list__actions">
                <button
                  type="button"
                  className="certificate-list__icon-btn"
                  aria-label={`Редактировать название «${certificate.name}»`}
                  disabled={isEditing}
                  onClick={() => startEditing(certificate)}
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  className="certificate-list__icon-btn certificate-list__icon-btn--danger"
                  aria-label={`Удалить «${certificate.name}»`}
                  disabled={!canDelete}
                  title={
                    canDelete
                      ? 'Удалить грамоту'
                      : 'Нельзя удалить последнюю грамоту'
                  }
                  onClick={() => onRemove(certificate.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Кнопка добавления новой грамоты (внизу списка) */}
      <button type="button" className="certificate-list__add" onClick={onAdd}>
        Добавить грамоту
      </button>
    </div>
  )
}

/** Фабрика грамоты с именем по умолчанию. */
export function createCertificate(
  name: string = DEFAULT_CERTIFICATE_NAME,
): Certificate {
  return {
    id: crypto.randomUUID(),
    name,
    recipientName: '',
    recipientInfo: '',
    place: null,
    degree: null,
    eventInfo: '',
  }
}

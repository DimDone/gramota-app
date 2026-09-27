// Панель общих параметров: ориентация/фон/отступы и перетаскиваемые текстовые блоки.

import { useState, type DragEvent } from 'react'
import { filterPersonNameInput } from './certificateName'
import {
  clampFontSizePt,
  clampMarginMm,
  maxCharsPerLine,
} from './pageGeometry'
import {
  createApprover,
  MAX_APPROVERS,
  type Approver,
  type CommonTextBlockId,
  type DocumentKind,
  type SharedCertificateParams,
} from './types'
import './SharedParamsPanel.css'

type SharedParamsPanelProps = {
  params: SharedCertificateParams
  onChange: (next: SharedCertificateParams) => void
}

const BLOCK_LABELS: Record<CommonTextBlockId, string> = {
  documentType: 'Вид документа',
  organization: 'Организация',
  approved: 'Утвердили',
  cityYear: 'Город и год',
}

/** Вставка beforeIndex: элемент окажется на позиции beforeIndex. */
function moveBlock(
  order: CommonTextBlockId[],
  fromId: CommonTextBlockId,
  beforeIndex: number,
): CommonTextBlockId[] {
  const fromIndex = order.indexOf(fromId)
  if (fromIndex < 0) return order

  const next = [...order]
  next.splice(fromIndex, 1)

  let insertAt = beforeIndex
  if (fromIndex < beforeIndex) insertAt -= 1
  insertAt = Math.max(0, Math.min(next.length, insertAt))
  next.splice(insertAt, 0, fromId)
  return next
}

function limitLine(value: string, maxChars: number): string {
  return value
    .split('\n')
    .map((line) => line.slice(0, maxChars))
    .join('\n')
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 7h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 1h4v2H4V3h4l1-1z"
      />
    </svg>
  )
}

export function SharedParamsPanel({ params, onChange }: SharedParamsPanelProps) {
  const [dragId, setDragId] = useState<CommonTextBlockId | null>(null)
  const [dropBeforeIndex, setDropBeforeIndex] = useState<number | null>(null)
  /** Черновик кегля: пока печатаем — не клампим на каждое нажатие. */
  const [fontDrafts, setFontDrafts] = useState<
    Partial<Record<CommonTextBlockId, string>>
  >({})

  function patch(partial: Partial<SharedCertificateParams>) {
    onChange({ ...params, ...partial })
  }

  function charsFor(blockId: CommonTextBlockId, fraction = 1): number {
    return maxCharsPerLine(
      params.orientation,
      params.marginsMm,
      params.fontSizesPt[blockId],
      fraction,
    )
  }

  // --- DnD порядка текстовых блоков (линия вставки + перестановка) ---
  function handleDragStart(
    event: DragEvent<HTMLElement>,
    blockId: CommonTextBlockId,
  ) {
    event.dataTransfer.setData('text/plain', blockId)
    event.dataTransfer.effectAllowed = 'move'
    setDragId(blockId)
  }

  function handleDragEnd() {
    setDragId(null)
    setDropBeforeIndex(null)
  }

  function updateDropIndicator(
    event: DragEvent<HTMLElement>,
    blockIndex: number,
  ) {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const before =
      event.clientY < rect.top + rect.height / 2 ? blockIndex : blockIndex + 1
    setDropBeforeIndex(before)
  }

  function handleDropOnList(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    const fromId = (event.dataTransfer.getData('text/plain') ||
      dragId) as CommonTextBlockId | null
    if (!fromId || dropBeforeIndex === null) {
      handleDragEnd()
      return
    }
    patch({
      textBlockOrder: moveBlock(params.textBlockOrder, fromId, dropBeforeIndex),
    })
    handleDragEnd()
  }

  // --- Кегль секции: черновик при вводе, clamp на blur/Enter ---
  function onFontDraftChange(blockId: CommonTextBlockId, raw: string) {
    if (raw === '' || /^\d{1,2}$/.test(raw)) {
      setFontDrafts((prev) => ({ ...prev, [blockId]: raw }))
    }
  }

  function commitFontSize(blockId: CommonTextBlockId) {
    const draft = fontDrafts[blockId]
    const parsed =
      draft === undefined || draft === ''
        ? params.fontSizesPt[blockId]
        : Number(draft)
    const nextSize = clampFontSizePt(parsed)
    patch({
      fontSizesPt: { ...params.fontSizesPt, [blockId]: nextSize },
    })
    setFontDrafts((prev) => {
      const next = { ...prev }
      delete next[blockId]
      return next
    })
  }

  // --- Строки блока «Утвердили» (до MAX_APPROVERS) ---
  function updateApprover(id: string, partial: Partial<Approver>) {
    patch({
      approvers: params.approvers.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    })
  }

  function addApprover() {
    if (params.approvers.length >= MAX_APPROVERS) return
    patch({ approvers: [...params.approvers, createApprover()] })
  }

  function removeApprover(id: string) {
    if (params.approvers.length <= 1) return
    patch({ approvers: params.approvers.filter((item) => item.id !== id) })
  }

  // Лимиты символов в строке от ширины A4, полей и кегля
  const orgMax = charsFor('organization')
  const cityMax = charsFor('cityYear', 0.72)
  const titleMax = charsFor('approved', 0.46)
  const nameMax = charsFor('approved', 0.46)

  return (
    <section className="shared-params" aria-label="Общие параметры">
      <header className="shared-params__header">
        <h2 className="shared-params__title">Общие параметры</h2>
      </header>

      <div className="shared-params__content">
        {/* Секция: ориентация, фон, поля в мм */}
        <div className="shared-params__section">
          <h3 className="shared-params__section-title">Ориентация, фон и поля</h3>

          <div className="shared-params__row">
            <div className="shared-params__field">
              <span className="shared-params__label">Ориентация</span>
              <div
                className="orientation-controls"
                role="group"
                aria-label="Ориентация листа"
              >
                <button
                  type="button"
                  className={
                    params.orientation === 'portrait'
                      ? 'orientation-controls__btn orientation-controls__btn--active'
                      : 'orientation-controls__btn'
                  }
                  aria-pressed={params.orientation === 'portrait'}
                  onClick={() => patch({ orientation: 'portrait' })}
                >
                  Вертикальная
                </button>
                <button
                  type="button"
                  className={
                    params.orientation === 'landscape'
                      ? 'orientation-controls__btn orientation-controls__btn--active'
                      : 'orientation-controls__btn'
                  }
                  aria-pressed={params.orientation === 'landscape'}
                  onClick={() => patch({ orientation: 'landscape' })}
                >
                  Горизонтальная
                </button>
              </div>
            </div>

            <div className="shared-params__field">
              <label className="shared-params__label" htmlFor="certificate-background">
                Фон
              </label>
              <select
                id="certificate-background"
                className="shared-params__control"
                value={params.backgroundId}
                onChange={(event) => patch({ backgroundId: event.target.value })}
              >
                <option value="none">Без фона</option>
                <option value="classic">Классический (скоро)</option>
                <option value="ornament">Орнамент (скоро)</option>
              </select>
            </div>
          </div>

          <div className="shared-params__margins" role="group" aria-label="Отступы в миллиметрах">
            {(
              [
                ['top', 'Сверху'],
                ['right', 'Справа'],
                ['bottom', 'Снизу'],
                ['left', 'Слева'],
              ] as const
            ).map(([side, label]) => (
              <label key={side} className="shared-params__margin">
                <span>{label}, мм</span>
                <input
                  className="shared-params__control shared-params__control--mm"
                  type="number"
                  min={0}
                  max={80}
                  step={0.5}
                  value={params.marginsMm[side]}
                  onChange={(event) =>
                    patch({
                      marginsMm: {
                        ...params.marginsMm,
                        [side]: clampMarginMm(Number(event.target.value)),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>

        {/* Секция: общий текст — DnD с линией вставки */}
        <div className="shared-params__section shared-params__section--text">
          <h3 className="shared-params__section-title">
            Общий текст
            <span className="shared-params__hint">
              Перетащите блоки за ⋮⋮ — линия покажет место вставки
            </span>
          </h3>

          <div
            className="shared-params__blocks"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDropOnList}
          >
            {params.textBlockOrder.map((blockId, blockIndex) => (
              <div key={blockId} className="text-block-slot">
                {dragId &&
                  dropBeforeIndex === blockIndex &&
                  dragId !== blockId && (
                    <div className="drop-line" aria-hidden="true" />
                  )}

                <article
                  className={
                    dragId === blockId
                      ? 'text-block text-block--dragging'
                      : 'text-block'
                  }
                  onDragOver={(event) => updateDropIndicator(event, blockIndex)}
                >
                  <div
                    className="text-block__head"
                    draggable
                    onDragStart={(event) => handleDragStart(event, blockId)}
                    onDragEnd={handleDragEnd}
                    title="Перетащите, чтобы изменить порядок"
                  >
                    <span className="text-block__drag" aria-hidden="true">
                      ⋮⋮
                    </span>
                    <span className="text-block__label">{BLOCK_LABELS[blockId]}</span>

                    <label className="text-block__font">
                      <span>pt</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          fontDrafts[blockId] ??
                          String(params.fontSizesPt[blockId])
                        }
                        aria-label={`Размер шрифта: ${BLOCK_LABELS[blockId]}`}
                        onChange={(event) =>
                          onFontDraftChange(blockId, event.target.value)
                        }
                        onBlur={() => commitFontSize(blockId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            commitFontSize(blockId)
                            ;(event.target as HTMLInputElement).blur()
                          }
                        }}
                        onMouseDown={(event) => event.stopPropagation()}
                      />
                    </label>
                  </div>

                  <div className="text-block__body">
                    {blockId === 'documentType' && (
                      <select
                        className="shared-params__control"
                        value={params.documentKind}
                        aria-label="Вид документа"
                        onChange={(event) =>
                          patch({
                            documentKind: event.target.value as DocumentKind,
                          })
                        }
                      >
                        <option value="gramota">Грамота</option>
                        <option value="diplom">Диплом</option>
                      </select>
                    )}

                    {blockId === 'organization' && (
                      <textarea
                        className="shared-params__control shared-params__control--tall"
                        value={params.organization}
                        placeholder="Название организации"
                        aria-label="Организация"
                        rows={3}
                        onChange={(event) =>
                          patch({
                            organization: limitLine(event.target.value, orgMax),
                          })
                        }
                      />
                    )}

                    {blockId === 'approved' && (
                      <div className="approvers">
                        {params.approvers.map((approver) => (
                          <div key={approver.id} className="approvers__row">
                            <input
                              className="shared-params__control"
                              value={approver.title}
                              placeholder="Должность / регалии"
                              aria-label="Должность утвердившего"
                              maxLength={titleMax}
                              onChange={(event) =>
                                updateApprover(approver.id, {
                                  title: event.target.value.slice(0, titleMax),
                                })
                              }
                            />
                            <input
                              className="shared-params__control"
                              value={approver.name}
                              placeholder="ФИО"
                              aria-label="ФИО утвердившего"
                              maxLength={nameMax}
                              onChange={(event) =>
                                updateApprover(approver.id, {
                                  name: filterPersonNameInput(
                                    event.target.value,
                                    nameMax,
                                  ),
                                })
                              }
                            />
                            <button
                              type="button"
                              className="approvers__trash"
                              aria-label="Удалить строку утвердившего"
                              disabled={params.approvers.length <= 1}
                              title={
                                params.approvers.length <= 1
                                  ? 'Нужна хотя бы одна строка'
                                  : 'Удалить'
                              }
                              onClick={() => removeApprover(approver.id)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="approvers__add"
                          disabled={params.approvers.length >= MAX_APPROVERS}
                          onClick={addApprover}
                        >
                          Добавить утвердившего
                        </button>
                      </div>
                    )}

                    {blockId === 'cityYear' && (
                      <div className="shared-params__pair shared-params__pair--city-year">
                        <input
                          className="shared-params__control"
                          value={params.city}
                          placeholder="Город"
                          aria-label="Город"
                          maxLength={cityMax}
                          onChange={(event) =>
                            patch({ city: event.target.value.slice(0, cityMax) })
                          }
                        />
                        <input
                          className="shared-params__control shared-params__control--year"
                          value={params.year}
                          placeholder="Год"
                          aria-label="Год"
                          inputMode="numeric"
                          maxLength={4}
                          onChange={(event) =>
                            patch({
                              year: event.target.value.replace(/[^\d]/g, '').slice(0, 4),
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </article>
              </div>
            ))}

            {dragId && dropBeforeIndex === params.textBlockOrder.length && (
              <div className="drop-line" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

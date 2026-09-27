// Панель общих параметров: ориентация/фон/отступы и фиксированные текстовые секции.

import { useState } from 'react'
import { BACKGROUND_THEMES } from './backgrounds/themes'
import { filterPersonNameInput } from './certificateName'
import {
  clampFontSizePt,
  clampMarginMm,
  limitLinesToWidth,
  maxCharsPerLine,
} from './pageGeometry'
import { isTextExpansion } from './textExpansion'
import {
  createApprover,
  DOCUMENT_VERB_LABEL,
  MAX_APPROVERS,
  type Approver,
  type DocumentKind,
  type FontSectionId,
  type LayoutCapacity,
  type SharedCertificateParams,
} from './types'
import './SharedParamsPanel.css'

type SharedParamsPanelProps = {
  params: SharedCertificateParams
  layout: LayoutCapacity
  onChange: (next: SharedCertificateParams) => void
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

export function SharedParamsPanel({
  params,
  layout,
  onChange,
}: SharedParamsPanelProps) {
  const [fontDrafts, setFontDrafts] = useState<
    Partial<Record<FontSectionId, string>>
  >({})

  function patch(partial: Partial<SharedCertificateParams>) {
    onChange({ ...params, ...partial })
  }

  function charsFor(section: FontSectionId, fraction = 1): number {
    return maxCharsPerLine(
      params.orientation,
      params.marginsMm,
      params.fontSizesPt[section],
      fraction,
    )
  }

  function onFontDraftChange(key: FontSectionId, raw: string) {
    if (raw === '' || /^\d{1,2}$/.test(raw)) {
      setFontDrafts((prev) => ({ ...prev, [key]: raw }))
    }
  }

  function commitFontSize(key: FontSectionId) {
    const draft = fontDrafts[key]
    const parsed =
      draft === undefined || draft === ''
        ? params.fontSizesPt[key]
        : Number(draft)
    patch({
      fontSizesPt: {
        ...params.fontSizesPt,
        [key]: clampFontSizePt(parsed),
      },
    })
    setFontDrafts((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function renderFontPtInput(fontKey: FontSectionId, label: string) {
    return (
      <label className="text-block__font">
        <span>pt</span>
        <input
          type="text"
          inputMode="numeric"
          value={fontDrafts[fontKey] ?? String(params.fontSizesPt[fontKey])}
          aria-label={`Размер шрифта: ${label}`}
          onChange={(event) => onFontDraftChange(fontKey, event.target.value)}
          onBlur={() => commitFontSize(fontKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitFontSize(fontKey)
              ;(event.target as HTMLInputElement).blur()
            }
          }}
        />
      </label>
    )
  }

  function updateApprover(id: string, partial: Partial<Approver>) {
    patch({
      approvers: params.approvers.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    })
  }

  function addApprover() {
    if (params.approvers.length >= MAX_APPROVERS) return
    if (!layout.canAddApprover) return
    patch({ approvers: [...params.approvers, createApprover()] })
  }

  function removeApprover(id: string) {
    if (params.approvers.length <= 1) return
    patch({ approvers: params.approvers.filter((item) => item.id !== id) })
  }

  const orgMax = charsFor('organization')
  const titleMax = charsFor('approved', 0.46)
  const nameMax = charsFor('approved', 0.46)

  return (
    <section className="shared-params" aria-label="Общие параметры">
      <header className="shared-params__header">
        <h2 className="shared-params__title">Общие параметры</h2>
      </header>

      <div className="shared-params__content">
        {/* Ориентация, фон, поля (отступы) */}
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
                {BACKGROUND_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
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

        {/* Общий текст: организация → вид/глагол → утвердили → город/год */}
        <div className="shared-params__section">
          <h3 className="shared-params__section-title">Общий текст</h3>

          <article className="text-block">
            <div className="text-block__head">
              <span className="text-block__label">Организация</span>
              {renderFontPtInput('organization', 'Организация')}
            </div>
            <div className="text-block__body">
              <textarea
                className="shared-params__control shared-params__control--tall"
                value={params.organization}
                placeholder="Название организации"
                aria-label="Организация"
                rows={3}
                onChange={(event) => {
                  const next = limitLinesToWidth(event.target.value, orgMax)
                  if (
                    isTextExpansion(params.organization, next) &&
                    !layout.canExpandText
                  ) {
                    return
                  }
                  patch({ organization: next })
                }}
              />
              <span className="shared-params__hint">
                До {orgMax} символов в строке
                {!layout.canExpandText
                  ? ' · на листе нет места для увеличения'
                  : ''}
              </span>
            </div>
          </article>

          <article className="text-block">
            <div className="text-block__head">
              <span className="text-block__label">Вид документа</span>
              {renderFontPtInput('documentType', 'Вид документа')}
            </div>
            <div className="text-block__body">
              <div className="document-type-fields">
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

                <div className="document-type-fields__verb">
                  <span className="shared-params__label">
                    «{DOCUMENT_VERB_LABEL[params.documentKind]}» (не
                    редактируется)
                  </span>
                  {renderFontPtInput(
                    'documentVerb',
                    DOCUMENT_VERB_LABEL[params.documentKind],
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className="text-block">
            <div className="text-block__head">
              <span className="text-block__label">Утвердили</span>
              {renderFontPtInput('approved', 'Утвердили')}
            </div>
            <div className="text-block__body">
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
                      onClick={() => removeApprover(approver.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="approvers__add"
                  disabled={
                    params.approvers.length >= MAX_APPROVERS ||
                    !layout.canAddApprover
                  }
                  title={
                    !layout.canAddApprover
                      ? 'На листе нет места для ещё одной строки'
                      : params.approvers.length >= MAX_APPROVERS
                        ? 'Достигнут максимум утверждающих'
                        : 'Добавить утвердившего'
                  }
                  onClick={addApprover}
                >
                  Добавить утвердившего
                </button>
              </div>
            </div>
          </article>

          <article className="text-block">
            <div className="text-block__head">
              <span className="text-block__label">Город и год</span>
              {renderFontPtInput('cityYear', 'Город и год')}
            </div>
            <div className="text-block__body">
              <div className="shared-params__pair shared-params__pair--city-year">
                <input
                  className="shared-params__control"
                  value={params.city}
                  placeholder="Город"
                  aria-label="Город"
                  maxLength={charsFor('cityYear', 0.72)}
                  onChange={(event) =>
                    patch({
                      city: event.target.value.slice(
                        0,
                        charsFor('cityYear', 0.72),
                      ),
                    })
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
            </div>
          </article>
        </div>

        {/* Кегли полей уникальных параметров (значения — общие для всех документов) */}
        <div className="shared-params__section">
          <h3 className="shared-params__section-title">
            Шрифты уникальных полей
          </h3>

          <article className="text-block">
            <div className="text-block__head">
              <span className="text-block__label">Информация о награждаемом</span>
              {renderFontPtInput('recipientInfo', 'Информация о награждаемом')}
            </div>
          </article>

          <article className="text-block">
            <div className="text-block__head">
              <span className="text-block__label">ФИО награждаемого</span>
              {renderFontPtInput('recipientName', 'ФИО награждаемого')}
            </div>
          </article>

          <article className="text-block">
            <div className="text-block__head">
              <span className="text-block__label">Информация о мероприятии</span>
              {renderFontPtInput('eventInfo', 'Информация о мероприятии')}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

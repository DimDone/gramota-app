// Уникальные параметры выбранной грамоты / диплома.

import { filterCertificateNameInput } from './certificateName'
import {
  limitLinesToWidth,
  maxCharsPerLine,
} from './pageGeometry'
import { isTextExpansion } from './textExpansion'
import type {
  Certificate,
  DocumentKind,
  LayoutCapacity,
  SharedCertificateParams,
} from './types'
import './UniqueParamsPanel.css'

type UniqueParamsPanelProps = {
  certificate: Certificate
  documentKind: DocumentKind
  shared: SharedCertificateParams
  layout: LayoutCapacity
  onChange: (next: Certificate) => void
}

export function UniqueParamsPanel({
  certificate,
  documentKind,
  shared,
  layout,
  onChange,
}: UniqueParamsPanelProps) {
  function patch(partial: Partial<Certificate>) {
    onChange({ ...certificate, ...partial })
  }

  function tryTextField(
    key: 'recipientInfo' | 'eventInfo',
    nextRaw: string,
    maxChars: number,
  ) {
    const next = limitLinesToWidth(nextRaw, maxChars)
    const prev = certificate[key]
    if (isTextExpansion(prev, next) && !layout.canExpandText) {
      return
    }
    patch({ [key]: next })
  }

  const nameMax = maxCharsPerLine(
    shared.orientation,
    shared.marginsMm,
    shared.fontSizesPt.recipientName,
  )
  const recipientMax = maxCharsPerLine(
    shared.orientation,
    shared.marginsMm,
    shared.fontSizesPt.recipientInfo,
  )
  const eventMax = maxCharsPerLine(
    shared.orientation,
    shared.marginsMm,
    shared.fontSizesPt.eventInfo,
  )

  return (
    <div className="unique-params">
      {documentKind === 'diplom' && (
        <label className="unique-params__field">
          <span className="unique-params__label">
            Степень <em>(необязательно)</em>
          </span>
          <select
            className="unique-params__control"
            value={certificate.degree ?? ''}
            aria-label="Степень"
            onChange={(event) => {
              const raw = event.target.value
              patch({
                degree:
                  raw === '' ? null : (Number(raw) as 1 | 2 | 3 | 4 | 5),
              })
            }}
          >
            <option value="">Не указывать</option>
            <option value={1}>I</option>
            <option value={2}>II</option>
            <option value={3}>III</option>
            <option value={4}>IV</option>
            <option value={5}>V</option>
          </select>
          <span className="unique-params__hint">В документе: «N степени»</span>
        </label>
      )}

      {/* ФИО: валидация как у названия грамоты */}
      <label className="unique-params__field">
        <span className="unique-params__label">ФИО награждаемого</span>
        <input
          className="unique-params__control"
          value={certificate.recipientName}
          placeholder="Фамилия Имя Отчество"
          aria-label="ФИО награждаемого"
          maxLength={nameMax}
          onChange={(event) => {
            const next = filterCertificateNameInput(event.target.value).slice(
              0,
              nameMax,
            )
            if (
              isTextExpansion(certificate.recipientName, next) &&
              !layout.canExpandText
            ) {
              return
            }
            patch({ recipientName: next })
          }}
        />
      </label>

      {/* Инфо о награждаемом: лимит ширины строки, как у больших полей */}
      <label className="unique-params__field">
        <span className="unique-params__label">
          Информация о награждаемом <em>(необязательно)</em>
        </span>
        <textarea
          className="unique-params__control unique-params__control--mid"
          value={certificate.recipientInfo}
          placeholder="Дополнительные сведения"
          aria-label="Информация о награждаемом"
          rows={3}
          onChange={(event) =>
            tryTextField('recipientInfo', event.target.value, recipientMax)
          }
        />
        <span className="unique-params__hint">
          До {recipientMax} символов в строке
          {!layout.canExpandText ? ' · на листе нет места для увеличения' : ''}
        </span>
      </label>

      {documentKind === 'gramota' && (
        <label className="unique-params__field">
          <span className="unique-params__label">
            Место <em>(необязательно)</em>
          </span>
          <select
            className="unique-params__control"
            value={certificate.place ?? ''}
            aria-label="Место"
            onChange={(event) => {
              const raw = event.target.value
              patch({ place: raw === '' ? null : Number(raw) })
            }}
          >
            <option value="">Не указывать</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="unique-params__hint">В документе: «за N место»</span>
        </label>
      )}

      {/* Мероприятие: лимит ширины строки + запрет роста при нехватке места */}
      <label className="unique-params__field unique-params__field--grow">
        <span className="unique-params__label">Информация о мероприятии</span>
        <textarea
          className="unique-params__control unique-params__control--tall"
          value={certificate.eventInfo}
          placeholder="Описание мероприятия / основания"
          aria-label="Информация о мероприятии"
          rows={6}
          onChange={(event) =>
            tryTextField('eventInfo', event.target.value, eventMax)
          }
        />
        <span className="unique-params__hint">
          До {eventMax} символов в строке
          {!layout.canExpandText ? ' · на листе нет места для увеличения' : ''}
        </span>
      </label>
    </div>
  )
}

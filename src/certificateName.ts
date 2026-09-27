// Правила имени грамоты и ФИО: фильтрация при вводе и строгая проверка.

const LETTER = /[A-Za-zА-Яа-яЁё]/
const ALLOWED_CHARS = /^[A-Za-zА-Яа-яЁё0-9 \-]*$/
const PERSON_ALLOWED_CHARS = /^[A-Za-zА-Яа-яЁё \-]*$/

/** Итоговое имя: слова из букв/цифр, дефис только как «буква-буква», слова через пробел. */
const VALID_NAME =
  /^[A-Za-zА-Яа-яЁё0-9]+(?:-[A-Za-zА-Яа-яЁё]+)*(?: [A-Za-zА-Яа-яЁё0-9]+(?:-[A-Za-zА-Яа-яЁё]+)*)*$/

export const DEFAULT_CERTIFICATE_NAME = 'Грамота'
export const MAX_CERTIFICATE_NAME_LENGTH = 255

function filterNameLikeInput(
  value: string,
  allowedChar: RegExp,
  maxLength: number,
): string {
  let filtered = [...value]
    .filter((ch) => allowedChar.test(ch))
    .join('')
    .slice(0, maxLength)

  filtered = filtered.replace(/^[ -]+/, '')
  filtered = filtered.replace(/ {2,}/g, ' ')
  filtered = filtered.replace(/-{2,}/g, '-')

  // Дефис допустим только сразу после буквы (следующую букву пользователь допишет)
  let result = ''
  for (const ch of filtered) {
    if (ch === '-') {
      const prev = result[result.length - 1]
      if (!prev || !LETTER.test(prev)) continue
    }
    result += ch
  }

  return result.slice(0, maxLength)
}

/** Фильтр названия грамоты: буквы, цифры, пробел, дефис. */
export function filterCertificateNameInput(value: string): string {
  return filterNameLikeInput(value, ALLOWED_CHARS, MAX_CERTIFICATE_NAME_LENGTH)
}

/** Фильтр ФИО: только буквы, пробел и дефис (без цифр). */
export function filterPersonNameInput(value: string, maxLength = 255): string {
  return filterNameLikeInput(value, PERSON_ALLOWED_CHARS, maxLength)
}

/** Строгая проверка готового имени (на blur / Enter). */
export function isValidCertificateName(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_CERTIFICATE_NAME_LENGTH &&
    VALID_NAME.test(value)
  )
}

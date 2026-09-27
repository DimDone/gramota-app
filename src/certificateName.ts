// Правила имени грамоты: разрешённые символы, мягкая фильтрация при вводе
// и строгая проверка при сохранении (дефис только между буквами).

const LETTER = /[A-Za-zА-Яа-яЁё]/
const ALLOWED_CHARS = /^[A-Za-zА-Яа-яЁё0-9 \-]*$/

/** Итоговое имя: слова из букв/цифр, дефис только как «буква-буква», слова через пробел. */
const VALID_NAME =
  /^[A-Za-zА-Яа-яЁё0-9]+(?:-[A-Za-zА-Яа-яЁё]+)*(?: [A-Za-zА-Яа-яЁё0-9]+(?:-[A-Za-zА-Яа-яЁё]+)*)*$/

export const DEFAULT_CERTIFICATE_NAME = 'Грамота'
export const MAX_CERTIFICATE_NAME_LENGTH = 255

/**
 * Фильтр во время набора: оставляет допустимые символы, режет длину,
 * убирает ведущие пробел/дефис и повторы (--, двойные пробелы).
 * Одиночный дефис после буквы разрешён — иначе нельзя набрать «Иванов-Петров».
 */
export function filterCertificateNameInput(value: string): string {
  let filtered = [...value]
    .filter((ch) => ALLOWED_CHARS.test(ch))
    .join('')
    .slice(0, MAX_CERTIFICATE_NAME_LENGTH)

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

  return result.slice(0, MAX_CERTIFICATE_NAME_LENGTH)
}

/** Строгая проверка готового имени (на blur / Enter). «----» и висячий дефис не проходят. */
export function isValidCertificateName(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_CERTIFICATE_NAME_LENGTH &&
    VALID_NAME.test(value)
  )
}

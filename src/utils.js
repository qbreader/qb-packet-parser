/**
 * Source: https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
 * @param {string} string
 * @returns
 */
export function escapeRegex (string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 *
 * @param {string} text
 * @param {boolean} [modaq]
 * @returns
 */
export function formatText (text, modaq = false) {
  return text
    .replace(/{b}/g, '<b>')
    .replace(/{\/b}/g, '</b>')
    .replace(/{u}/g, '<u>')
    .replace(/{\/u}/g, '</u>')
    .replace(/{i}/g, modaq ? '<em>' : '<i>')
    .replace(/{\/i}/g, modaq ? '</em>' : '</i>')
    .trim();
}

/**
 *
 * @param {string} text
 * @param {boolean} [includeItalics]
 * @param {boolean} [sanitizeString]
 * @returns {string}
 */
export function removeFormatting (text, includeItalics = false, sanitizeString = true) {
  text = text
    .replace(/{b}/g, '')
    .replace(/{\/b}/g, '')
    .replace(/{u}/g, '')
    .replace(/{\/u}/g, '');

  if (!includeItalics) {
    text = text
      .replace(/{i}/g, '')
      .replace(/{\/i}/g, '');
  }

  text = text.trim();

  if (!sanitizeString) {
    return text;
  }

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018-\u201B]/g, '\'')
    .replace(/[\u201C-\u201F]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2032-\u2037]/g, '\'')
    .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
    .replace(/\u0142/g, 'l'); // ł -> l
}

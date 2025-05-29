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
 * @returns {string}
 */
export function removeFormatting (text, includeItalics = false) {
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

  return text.trim();
}

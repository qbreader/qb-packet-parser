import ANSWER_TYPOS from './modules/answer-typos.js';
import STANDARDIZE_ALTERNATE_SUBCATS from './modules/standardize-alternate-subcats.js';
import STANDARDIZE_SUBCATS from './modules/standardize-subcats.js';

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
 * @returns
 */
export function getAlternateSubcategory (text) {
  if (text[0] === '<' && text[text.length - 1] === '>') {
    text = text.slice(1, -1);
  }
  text = text.toLowerCase();
  // handle dashes
  text = text.replace(/[\u2010-\u2015]/g, ' ');
  text = text.replace(/\u002d/g, ' ');

  const textSplit = text.split(/[/,; ]/);

  for (const subcat in STANDARDIZE_ALTERNATE_SUBCATS) {
    let works = true;
    const words = subcat.toLowerCase().split(' ');

    for (const word of words) {
      if (!textSplit.includes(word)) {
        works = false;
        break;
      }
    }

    if (works) {
      return STANDARDIZE_ALTERNATE_SUBCATS[subcat];
    }
  }

  return '';
}

/**
 *
 * @param {string} text
 * @returns
 */
export function getSubcategory (text) {
  if (text[0] === '<' && text[text.length - 1] === '>') {
    text = text.slice(1, -1);
  }
  text = text.toLowerCase();
  // handle dashes
  text = text.replace(/[\u2010-\u2015]/g, ' ');
  text = text.replace(/\u002d/g, ' ');

  const textSplit = text.split(/[/,;:. ]/);

  for (const subcat in STANDARDIZE_SUBCATS) {
    let works = true;
    const words = subcat.toLowerCase().split(' ');

    for (const word of words) {
      if (!textSplit.includes(word)) {
        works = false;
        break;
      }
    }

    if (works) {
      return STANDARDIZE_SUBCATS[subcat];
    }
  }

  return '';
}

/**
 * Preprocesses the packet text by performing various replacements and cleaning operations.
 *
 * @param {string} text - The packet text to preprocess.
 * @returns {string} The preprocessed packet text.
 */
export function preprocessPacket (text) {
  // Remove spaces before the first non-space character
  text = text.replace(/^ +/g, '');

  text = text + '\n0.';
  // Remove zero-width characters
  text = text.replace(/\f/g, '').replace(/\u200b/g, '');
  // Change soft hyphens to regular hyphens
  text = text.replace(/\xad/g, '-');
  // Change Greek question mark to semicolon
  text = text.replace(/\u037e/g, ';');

  text = text
    .replace(/\u00a0/g, ' ')
    .replace(/ {\/bu}/g, '{/bu} ')
    .replace(/ {\/u}/g, '{/u} ')
    .replace(/ {\/i}/g, '{/i} ')
    .replace(/{i}\n{\/i}/g, '\n')
    .replace(/{i} {\/i}/g, ' ')
    .replace(/\n10\]/g, '[10]')
    .replace(/\[5,5\]/g, '[10]')
    .replace(/\[5\/5\]/g, '[10]')
    .replace(/\[5, 5\]/g, '[10]')
    .replace(/\[5,5,5,5\]/g, '[20]')
    .replace(/\[5\/5\/5\/5\]/g, '[20]')
    .replace(/\[10\/10\]/g, '[20]')
    .replace(/\[2x10\]/g, '[20]')
    .replace(/\[2x5\]/g, '[10]')
    .replace(/\[10 /g, '[10] ')
    .replace(/AUDIO RELATED BONUS: /g, '\n')
    .replace(/HANDOUT RELATED BONUS: /g, '\n')
    .replace(/RELATED BONUS: /g, '\n')
    .replace(/RELATED BONUS\. /g, '\n')
    .replace(/RELATED BONUS\n/g, '\n\n')
    .replace(/HANDOUT BONUS: /g, '\n')
    .replace(/BONUS: /g, '\n')
    .replace(/Bonus: /g, '\n')
    .replace(/BONUS\. /g, '\n')
    .replace(/TOSSUP\. /g, '');

  for (const typo of ANSWER_TYPOS) {
    text = text.replace(new RegExp(typo, 'g'), 'ANSWER:');
    text = text.replace(new RegExp(typo[0] + typo.slice(1).toLowerCase(), 'g'), 'ANSWER:');
  }

  // Replace tabs and redundant spaces
  text = text.replace(/\t/g, ' ');
  text = text.replace(/ {2,}/g, ' ');

  // Remove redundant tags
  text = text.replace(/\{(\w+)\}\{\/\1\}/g, '');
  text = text.replace(/\{\/(\w+)\}\{\1\}/g, '');

  // Handle HTML formatting at the start of the string
  text = text.replace(/^\{(\w+)\}(\d{1,2}|TB|X)\./gim, '1. {$1}');
  text = text.replace(/^\{(\w+)\}ANSWER(:?)/gim, 'ANSWER$2{$1}');

  // Handle nonstandard question numbering
  text = text.replace(/^\(?(\d{1,2}|TB)\)/g, '1. ');
  text = text.replace(/^(TB|X|Tiebreaker|Extra)[.:]?/g, '21.');
  text = text.replace(/^(T|S|TU)\d{1,2}[.:]?/g, '21.');

  // Handle nonstandard bonus part numbering
  text = text.replace(/^[ABC][.:] */g, '[10] ');
  text = text.replace(/^BS\d{1,2}[.:]?/g, '21.');

  // Handle question number on a new line from the question text
  text = text.replace(/(\d{1,2}\.) *\n/g, '$1');

  // Clear lines that are all spaces
  text = text.replace(/^\s*$/g, '');

  // Ensure ANSWER starts on a new line
  text = text.replace(/(?<=.)(?=ANSWER:)/g, '\n');

  // Remove duplicate lines
  const count = (text.match(/(.+)\n\1/g) || []).length;
  text = text.replace(/([^\n]+)\n\1\n/g, '$1\n');
  if (count > 0) {
    console.warn(`Removed ${count} duplicate lines`);
  }

  // Remove "Page X" lines
  text = text.replace(/Page \d+( of \d+)?/g, '');

  return text;
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

import NORM_ALTERNATE_SUBCATEGORY from './constants/norm-alternate-subcategory.js';
import NORM_SUBCATEGORY from './constants/norm-subcategory.js';
import { SUBCATEGORY_TO_CATEGORY } from './constants/category-subcategory.js';
import { removeFormatting } from './utils.js';

/**
 * Parses the category tag from the given text and extracts category, subcategory,
 * alternate subcategory, and metadata.
 *
 * @param {string} text - The input text to parse.
 * @returns {[string, string, string, string] | null} A tuple containing category, subcategory,
 * alternate subcategory, and metadata, or null if no category tag is found.
 */
export default function parseCategoryTag (text) {
  // Remove formatting and search for the category tag using the regex
  const CATEGORY_TAG = /<[^>]*>/gim;
  let categoryTag = removeFormatting(text).match(CATEGORY_TAG);

  if (!categoryTag) {
    return null;
  }

  categoryTag = categoryTag[0].trim().replace(/\n/g, ' ');
  const metadata = categoryTag.slice(1, -1); // Remove the first and last characters

  const subcategory = getSubcategory(categoryTag);
  const alternateSubcategory = getAlternateSubcategory(categoryTag);
  const category = subcategory ? SUBCATEGORY_TO_CATEGORY[subcategory] : '';

  return [category, subcategory, alternateSubcategory, metadata];
}

/**
 *
 * @param {string} text
 * @returns
 */
function getAlternateSubcategory (text) {
  if (text[0] === '<' && text[text.length - 1] === '>') {
    text = text.slice(1, -1);
  }
  text = text.toLowerCase();
  // handle dashes
  text = text.replace(/[\u2010-\u2015]/g, ' ');
  text = text.replace(/\u002d/g, ' ');

  const textSplit = text.split(/[/,; ]/);

  for (const candidate in NORM_ALTERNATE_SUBCATEGORY) {
    let works = true;
    const words = candidate.toLowerCase().split(' ');

    for (const word of words) {
      if (!textSplit.includes(word)) {
        works = false;
        break;
      }
    }

    if (works) {
      return NORM_ALTERNATE_SUBCATEGORY[candidate];
    }
  }

  return '';
}

/**
 *
 * @param {string} text
 * @returns
 */
function getSubcategory (text) {
  if (text[0] === '<' && text[text.length - 1] === '>') {
    text = text.slice(1, -1);
  }
  text = text.toLowerCase();
  // handle dashes
  text = text.replace(/[\u2010-\u2015]/g, ' ');
  text = text.replace(/\u002d/g, ' ');

  const textSplit = text.split(/[/,;:. ]/);

  for (const candidate in NORM_SUBCATEGORY) {
    let works = true;
    const words = candidate.toLowerCase().split(' ');

    for (const word of words) {
      if (!textSplit.includes(word)) {
        works = false;
        break;
      }
    }

    if (works) {
      return NORM_SUBCATEGORY[candidate];
    }
  }

  return '';
}

import STANDARDIZE_ALTERNATE_SUBCATS from './constants/standardize-alternate-subcats.js';
import STANDARDIZE_SUBCATS from './constants/standardize-subcats.js';
import SUBCAT_TO_CAT from './constants/subcat-to-cat.js';
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
  const category = subcategory ? SUBCAT_TO_CAT[subcategory] : '';

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
function getSubcategory (text) {
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

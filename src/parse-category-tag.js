import NORM_ALTERNATE_SUBCATEGORY from './constants/norm-alternate-subcategory.js';
import NORM_SUBCATEGORY from './constants/norm-subcategory.js';
import { SUBCATEGORY_TO_CATEGORY } from './constants/category-subcategory.js';
import { removeFormatting } from './utils.js';
import NORM_CATEGORY from './constants/norm-category.js';

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

  if (!categoryTag) { return null; }

  categoryTag = categoryTag[0].trim().replace(/\n/g, ' ');
  const metadata = categoryTag.slice(1, -1); // Remove the first and last characters

  const subcategory = getKeyValueMatches(categoryTag, NORM_SUBCATEGORY)[0] || '';
  const alternateSubcategory = getKeyValueMatches(categoryTag, NORM_ALTERNATE_SUBCATEGORY)[0] || '';
  const category = subcategory ? SUBCATEGORY_TO_CATEGORY[subcategory] : (getKeyValueMatches(categoryTag, NORM_CATEGORY)[0] || '');

  return [category, subcategory, alternateSubcategory, metadata];
}

/**
 * For each key in the lookup object, it checks if all words in that key are present
 * in the transformed text. If so, the corresponding value is added to the results.
 *
 * @param {string} text - The input text to search within. Angle brackets will be removed if present at start/end.
 * @param {Object.<string, string>} lookup - An object where keys are phrases to match and values are the corresponding return values.
 * @returns {string[]} An array of values from the lookup object whose keys had all their words found in the text.
 */
function getKeyValueMatches (text, lookup) {
  if (text[0] === '<' && text[text.length - 1] === '>') {
    text = text.slice(1, -1);
  }
  text = text.toLowerCase();
  // handle dashes
  text = text.replace(/[\u2010-\u2015]/g, ' ');
  text = text.replace(/\u002d/g, ' ');
  text = text.replace('(', '').replace(')', '');
  const textSplit = text.split(/[/,; ]/);

  const results = [];

  for (const candidate in lookup) {
    let works = true;
    const words = candidate.toLowerCase().split(' ');

    for (const word of words) {
      if (!textSplit.includes(word)) {
        works = false;
        break;
      }
    }

    if (works) { results.push(lookup[candidate]); }
  }

  return results;
}

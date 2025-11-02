import { SUBCATEGORY_TO_CATEGORY } from '../constants/category-subcategory.js';
import { CATEGORY_TO_ALTERNATE_SUBCATEGORY } from '../constants/category-alternate-subcategory.js';
import { SUBCATEGORY_TO_SUBSUBCATEGORY } from '../constants/subcategory-subsubcategory.js';
import CLASSIFIER_ALTERNATE_SUBCATEGORY from './classifier-alternate-subcategory.js';
import CLASSIFIER_SUBCATEGORY from './classifier-subcategory.js';
import CLASSIFIER_SUBSUBCATEGORY from './classifier-subsubcategory.js';
import STOP_WORDS from './stop-words.js';
import CLASSIFIER_SUBCATEGORY_LIST from './subcategories.js';

/**
 * Classifies the given text into a category, subcategory, and alternate subcategory.
 *
 * @param {string} text - The text to classify.
 * @param {string} [fixedCategory=''] - An optional fixed category to use instead of classifying the category.
 * @returns {[string, string, string]} A tuple containing the category, subcategory, and alternate subcategory.
 */
export function classifyQuestion (text, fixedCategory = undefined) {
  const subcategory = classifyText(text, { mode: 'subcategory', category: fixedCategory });
  const category = SUBCATEGORY_TO_CATEGORY[subcategory];
  let alternateSubcategory = '';

  if (category in CATEGORY_TO_ALTERNATE_SUBCATEGORY) {
    alternateSubcategory = classifyText(text, { mode: 'alternate-subcategory', category });
  }

  if (subcategory in SUBCATEGORY_TO_SUBSUBCATEGORY) {
    // TODO: change left-hand variable to subsubcategory
    alternateSubcategory = classifyText(text, { mode: 'subsubcategory', subcategory });
  }

  return [SUBCATEGORY_TO_CATEGORY[subcategory], subcategory, alternateSubcategory];
}

/**
 * Classifies the given text based on the specified mode.
 *
 * @param {string} text - The text to classify.
 * @param {object} [options={}]
 * @param {'subcategory' | 'alternate-subcategory' | 'subsubcategory'} [options.mode="subcategory"]
 * @param {string} [options.category=""] - The category (required for "alternate-subcategory" mode).
 * @param {string} [options.subcategory=""] - The subcategory (required for "subsubcategory" mode).
 * @returns {string} The classification result.
 */
export function classifyText (text, { mode = 'subcategory', category = '', subcategory = '' } = {}) {
  switch (mode) {
    case 'subcategory': {
      const validIndices = [];
      if (category) {
        for (const i in CLASSIFIER_SUBCATEGORY_LIST) {
          const subcategory = CLASSIFIER_SUBCATEGORY_LIST[i];
          if (SUBCATEGORY_TO_CATEGORY[subcategory] === category) { validIndices.push(parseInt(i)); }
        }
      }
      const index = naiveBayesClassify(
        text,
        CLASSIFIER_SUBCATEGORY.word_to_subcategory,
        CLASSIFIER_SUBCATEGORY.subcategory_frequencies,
        validIndices
      );
      return CLASSIFIER_SUBCATEGORY_LIST[index];
    }

    case 'alternate-subcategory': {
      if (!category || !(category in CATEGORY_TO_ALTERNATE_SUBCATEGORY)) {
        throw new Error(`Category ${category} does not have alternate subcategories.`);
      }
      const index = naiveBayesClassify(
        text,
        CLASSIFIER_ALTERNATE_SUBCATEGORY.word_to_alternate_subcategory[category],
        CLASSIFIER_ALTERNATE_SUBCATEGORY.alternate_subcategory_frequencies[category]
      );
      return CATEGORY_TO_ALTERNATE_SUBCATEGORY[category][index];
    }

    case 'subsubcategory': {
      if (!subcategory || !(subcategory in SUBCATEGORY_TO_SUBSUBCATEGORY)) {
        throw new Error(`Subcategory ${subcategory} does not have subsubcategories.`);
      }
      const index = naiveBayesClassify(
        text,
        CLASSIFIER_SUBSUBCATEGORY.word_to_subsubcategory[subcategory],
        CLASSIFIER_SUBSUBCATEGORY.subsubcategory_frequencies[subcategory]
      );
      return SUBCATEGORY_TO_SUBSUBCATEGORY[subcategory][index];
    }
  }
}

/**
 * Classifies the given text using a Naive Bayes classifier.
 *
 * @param {string} text - The text to classify.
 * @param {Object} wordToFrequency - A dictionary mapping words to their frequency distributions across classes.
 * @param {number[]} classFrequencies - The frequencies of each class.
 * @param {number[]} [validIndices] - An optional array of valid class indices to consider for classification.
 * @param {number} [epsilon=0.01] - A smoothing factor to avoid zero probabilities.
 * @returns {number} The index of the predicted class.
 */
function naiveBayesClassify (text, wordToFrequency, classFrequencies, validIndices, epsilon = 0.01) {
  // Calculate log-likelihoods for each class
  const likelihoods = classFrequencies.map(x => Math.log(x));
  const smoothedClassFrequencies = classFrequencies.map(x => Math.log(x + epsilon * classFrequencies.length));

  // Preprocess the text
  text = removePunctuation(text).toLowerCase().split(/\s+/);

  for (const token of text) {
    if (STOP_WORDS.has(token)) {
      continue; // Skip stop words
    }

    if (!wordToFrequency[token]) {
      continue; // Skip unknown words
    }

    for (let i = 0; i < classFrequencies.length; i++) {
      likelihoods[i] += Math.log(wordToFrequency[token][i] + epsilon);
      likelihoods[i] -= smoothedClassFrequencies[i];
    }
  }

  if (Array.isArray(validIndices) && validIndices.length > 0) {
    for (let i = 0; i < likelihoods.length; i++) {
      if (!validIndices.includes(i)) {
        likelihoods[i] = -Infinity; // Ignore invalid indices
      }
    }
  }

  const maxLikelihood = Math.max(...likelihoods);
  const candidateIndices = likelihoods
    .map((likelihood, index) => likelihood === maxLikelihood ? index : null)
    .filter(index => index !== null);

  // Randomly choose one of the valid indices (if there are multiple)
  return candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
}

function removePunctuation (s, punctuation = '.,!-;:\'"\\/?@#$%^&*_~()[]{}“”‘’') {
  return s.split('').filter(ch => !punctuation.includes(ch)).join('');
}

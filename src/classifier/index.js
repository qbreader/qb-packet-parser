import { ALTERNATE_SUBCATEGORIES, SUBCATEGORIES, SUBCATEGORY_TO_CATEGORY, SUBSUBCATEGORIES } from './categories.js';
import CLASSIFIER_ALTERNATE_SUBCATEGORY from './classifier-alternate-subcategory.js';
import CLASSIFIER_SUBCATEGORY from './classifier-subcategory.js';
import CLASSIFIER_SUBSUBCATEGORY from './classifier-subsubcategory.js';
import STOP_WORDS from './stop-words.js';

/**
 * Classifies the given text into a category, subcategory, and alternate subcategory.
 *
 * @param {string} text - The text to classify.
 * @returns {[string, string, string]} A tuple containing the category, subcategory, and alternate subcategory.
 */
export function classifyQuestion (text) {
  const subcategory = classifyText(text, { mode: 'subcategory' });
  const category = SUBCATEGORY_TO_CATEGORY[subcategory];
  let alternateSubcategory = '';

  if (category in ALTERNATE_SUBCATEGORIES) {
    alternateSubcategory = classifyText(text, { mode: 'alternate-subcategory', category });
  }

  if (subcategory in SUBSUBCATEGORIES) {
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
      const index = naiveBayesClassify(
        text,
        CLASSIFIER_SUBCATEGORY.word_to_subcategory,
        CLASSIFIER_SUBCATEGORY.subcategory_frequencies
      );
      return SUBCATEGORIES[index];
    }

    case 'alternate-subcategory': {
      const index = naiveBayesClassify(
        text,
        CLASSIFIER_ALTERNATE_SUBCATEGORY.word_to_alternate_subcategory[category],
        CLASSIFIER_ALTERNATE_SUBCATEGORY.alternate_subcategory_frequencies[category]
      );
      return ALTERNATE_SUBCATEGORIES[category][index];
    }

    case 'subsubcategory': {
      const index = naiveBayesClassify(
        text,
        CLASSIFIER_SUBSUBCATEGORY.word_to_subsubcategory[subcategory],
        CLASSIFIER_SUBSUBCATEGORY.subsubcategory_frequencies[subcategory]
      );
      return SUBSUBCATEGORIES[subcategory][index];
    }
  }
}

/**
 * Classifies the given text using a Naive Bayes classifier.
 *
 * @param {string} text - The text to classify.
 * @param {Object} wordToFrequency - A dictionary mapping words to their frequency distributions across classes.
 * @param {number[]} classFrequencies - The frequencies of each class.
 * @param {number} [epsilon=0.01] - A smoothing factor to avoid zero probabilities.
 * @returns {number} The index of the predicted class.
 */
function naiveBayesClassify (text, wordToFrequency, classFrequencies, epsilon = 0.01) {
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

  // Find the maximum likelihood
  const maxLikelihood = Math.max(...likelihoods);
  const validIndices = likelihoods
    .map((likelihood, index) => likelihood === maxLikelihood ? index : null)
    .filter(index => index !== null);

  // Randomly choose one of the valid indices (if there are multiple)
  return validIndices[Math.floor(Math.random() * validIndices.length)];
}

function removePunctuation (s, punctuation = '.,!-;:\'"\\/?@#$%^&*_~()[]{}“”‘’') {
  return s.split('').filter(ch => !punctuation.includes(ch)).join('');
}

/**
 * This constant contains the subcategories used in the classifier:
 * - In classifier-subcategory.js, `word_to_subcategory[token][index]` corresponds to `CLASSIFIER_SUBCATEGORY_LIST[index]`,
 * and `word_to_subcategory[token].length === CLASSIFIER_SUBCATEGORY_LIST.length === 27`.
 * - This differs from `SUBCATEGORY_LIST` in the `constants/category-subcategory.js` file in that it is missing the subcategories
 * "Classical Literature", "Other Literature", "Other History", and "Other Academic".
 */
const CLASSIFIER_SUBCATEGORY_LIST = [
  'American Literature',
  'British Literature',
  'European Literature',
  'World Literature',
  'American History',
  'Ancient History',
  'European History',
  'World History',
  'Biology',
  'Chemistry',
  'Physics',
  'Other Science',
  'Visual Fine Arts',
  'Auditory Fine Arts',
  'Other Fine Arts',
  'Religion',
  'Mythology',
  'Philosophy',
  'Social Science',
  'Current Events',
  'Geography',
  'Movies',
  'Music',
  'Sports',
  'Television',
  'Video Games',
  'Other Pop Culture'
];
export default CLASSIFIER_SUBCATEGORY_LIST;

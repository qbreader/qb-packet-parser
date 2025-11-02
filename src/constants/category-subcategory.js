import invertMapping from './invert-mapping.js';

export const CATEGORY_TO_SUBCATEGORY = {
  Literature: ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
  History: ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
  Science: ['Biology', 'Chemistry', 'Physics', 'Other Science'],
  'Fine Arts': ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
  Religion: ['Religion'],
  Mythology: ['Mythology'],
  Philosophy: ['Philosophy'],
  'Social Science': ['Social Science'],
  'Current Events': ['Current Events'],
  Geography: ['Geography'],
  'Other Academic': ['Other Academic'],
  'Pop Culture': ['Movies', 'Music', 'Sports', 'Television', 'Video Games', 'Other Pop Culture']
};
export const CATEGORY_LIST = Object.keys(CATEGORY_TO_SUBCATEGORY);

export const SUBCATEGORY_TO_CATEGORY = invertMapping(CATEGORY_TO_SUBCATEGORY, false);
export const SUBCATEGORY_LIST = Object.keys(SUBCATEGORY_TO_CATEGORY);

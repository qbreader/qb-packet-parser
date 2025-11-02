import invertMapping from './invert-mapping.js';

export const SUBCATEGORY_TO_SUBSUBCATEGORY = {
  'Other Science': ['Astronomy', 'Computer Science', 'Earth Science', 'Engineering', 'Math', 'Misc Science'],
  'Other Fine Arts': ['Architecture', 'Dance', 'Film', 'Jazz', 'Musicals', 'Opera', 'Photography', 'Misc Arts'],
  'Social Science': ['Anthropology', 'Economics', 'Linguistics', 'Psychology', 'Sociology', 'Other Social Science']
};

export const SUBSUBCATEGORY_TO_SUBCATEGORY = invertMapping(SUBCATEGORY_TO_SUBSUBCATEGORY, false);
export const SUBSUBCATEGORY_LIST = Object.keys(SUBSUBCATEGORY_TO_SUBCATEGORY);

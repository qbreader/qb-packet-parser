import invertMapping from './invert-mapping.js';

const NORM_CATEGORY = {
  Literature: [],
  History: [],
  Science: [],
  'Fine Arts': [],
  Religion: [],
  Mythology: [],
  Philosophy: [],
  'Social Science': [],
  'Current Events': [],
  Geography: [],
  'Other Academic': [],
  'Pop Culture': ['Trash']
};

export default invertMapping(NORM_CATEGORY, true);

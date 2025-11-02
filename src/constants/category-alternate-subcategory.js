import invertMapping from './invert-mapping.js';

export const CATEGORY_TO_ALTERNATE_SUBCATEGORY = {
  Literature: ['Drama', 'Long Fiction', 'Poetry', 'Short Fiction', 'Misc Literature']
};

export const ALTERNATE_SUBCATEGORY_TO_CATEGORY = invertMapping(CATEGORY_TO_ALTERNATE_SUBCATEGORY, false);
export const ALTERNATE_SUBCATEGORY_LIST = Object.keys(ALTERNATE_SUBCATEGORY_TO_CATEGORY);

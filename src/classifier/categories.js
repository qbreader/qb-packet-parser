export const SUBCATEGORY_TO_CATEGORY = {
  'American Literature': 'Literature',
  'British Literature': 'Literature',
  'Classical Literature': 'Literature',
  'European Literature': 'Literature',
  'World Literature': 'Literature',
  'Other Literature': 'Literature',
  'American History': 'History',
  'Ancient History': 'History',
  'European History': 'History',
  'World History': 'History',
  'Other History': 'History',
  Biology: 'Science',
  Chemistry: 'Science',
  Physics: 'Science',
  'Other Science': 'Science',
  'Visual Fine Arts': 'Fine Arts',
  'Auditory Fine Arts': 'Fine Arts',
  'Other Fine Arts': 'Fine Arts',
  Religion: 'Religion',
  Mythology: 'Mythology',
  Philosophy: 'Philosophy',
  'Social Science': 'Social Science',
  'Current Events': 'Current Events',
  Geography: 'Geography',
  'Other Academic': 'Other Academic',
  Trash: 'Trash'
};
export const SUBCATEGORIES = Object.keys(SUBCATEGORY_TO_CATEGORY);

export const ALTERNATE_SUBCATEGORIES = {
  Literature: ['Drama', 'Long Fiction', 'Poetry', 'Short Fiction', 'Misc Literature']
};

export const SUBSUBCATEGORIES = {
  Science: ['Astronomy', 'Computer Science', 'Earth Science', 'Engineering', 'Math', 'Misc Science'],
  'Fine Arts': ['Architecture', 'Dance', 'Film', 'Jazz', 'Musicals', 'Opera', 'Photography', 'Misc Arts'],
  'Social Science': ['Anthropology', 'Economics', 'Linguistics', 'Psychology', 'Sociology', 'Other Social Science']
};

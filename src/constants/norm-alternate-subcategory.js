import invertMapping from './invert-mapping.js';

const NORM_ALTERNATE_SUBCATEGORY = {
  Drama: [],
  Poetry: [],
  'Long Fiction': ['LongFic', 'Mixed Fiction', 'Long Form', 'Novel'],
  'Short Fiction': ['Short Story', 'Short Form'],
  'Misc Literature': ['Nonfiction'],
  Astronomy: [],
  'Computer Science': ['Comp Sci', 'CS Science'],
  'Earth Science': ['Earth Sci', 'Earth', 'Atmospheric Science'],
  Engineering: [],
  Math: ['Maths', 'Mathematics', 'Statistics'],
  'Misc Science': [],
  Architecture: [],
  Dance: [],
  Film: [],
  Jazz: [],
  Musicals: [],
  Opera: [],
  Photography: [],
  'Misc Arts': [],
  Anthropology: [],
  Economics: [],
  Linguistics: ['Ling'],
  Psychology: [],
  Sociology: [],
  'Other Social Science': []
};
export default invertMapping(NORM_ALTERNATE_SUBCATEGORY, true);

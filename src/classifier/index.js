export function classifyQuestion (text) {
  return ['Literature', 'British Literature', 'Long Fiction'];
}

export function classify (text, { mode = 'subcategory', category = '', subcategory = '' }) {
  switch (mode) {
    case 'subcategory': return 'British Literature';
    case 'alternate-subcategory': return 'Long Fiction';
    case 'subsubcategory': return 'Jazz';
  }
}

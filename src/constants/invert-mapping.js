/**
 * Inverts a mapping object by creating a new object where:
 * - Each original key maps to itself
 * - Each value in the original arrays maps back to its parent key
 *
 * @param {Object.<string, Array<string>>} mapping - An object where keys map to arrays of string values
 * @param {boolean} addSelf - Whether to include original keys mapping to themselves
 * @returns {Object.<string, string>} An inverted mapping where both original keys and their values map to the original keys
 *
 * @example
 * const mapping = {
 *   'fruit': ['apple', 'banana'],
 *   'vegetable': ['carrot', 'broccoli']
 * };
 * const inverted = invertMapping(mapping);
 * // Returns:
 * // {
 * //   'fruit': 'fruit',
 * //   'apple': 'fruit',
 * //   'banana': 'fruit',
 * //   'vegetable': 'vegetable',
 * //   'carrot': 'vegetable',
 * //   'broccoli': 'vegetable'
 * // }
 */
export default function invertMapping (mapping, addSelf) {
  if (addSelf === undefined) {
    throw new Error('The addSelf parameter must be explicitly provided as true or false.');
  }

  const inverted = {};
  for (const key in mapping) {
    if (addSelf) { inverted[key] = key; }
    for (const value of mapping[key]) {
      inverted[value] = key;
    }
  }
  return inverted;
}

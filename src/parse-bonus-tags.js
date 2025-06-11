/**
 * Parses the bonus tags from the given text and extracts the difficulties and values.
 * If `this.modaq` or `this.buzzpoints` is true, the values will be set to 10 if no value is found.
 *
 * @param {string} text - The text to parse the bonus tags from.
 * @param {boolean} [alwaysFillValues=false] - If true, always fills `values` array with 10 if no specific value is found.
 * @returns {[Array<"e" | "m" | "h">, number[]]} A tuple containing the difficulties and values.
 */
export default function parseBonusTags (text, alwaysFillValues = false) {
  const BONUS_TAGS = /(?<=\[)\d{0,2}?[EMH]?(?=\])/gim;
  const tags = text.match(BONUS_TAGS) || [];
  const difficultyModifiers = [];
  let values = [];

  for (const tag of tags) {
    for (const difficultyModifier of ['e', 'm', 'h']) {
      if (tag.toLowerCase().includes(difficultyModifier)) {
        difficultyModifiers.push(difficultyModifier);
        break;
      }
    }

    for (const value of ['10', '15', '20', '5']) {
      if (tag.includes(value)) {
        values.push(parseInt(value));
        break;
      }
    }
  }

  if (values.length === 0 && alwaysFillValues) {
    values = Array(tags.length).fill(10);
  }

  return [difficultyModifiers, values];
}

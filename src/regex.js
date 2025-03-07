const FLAGS = 'gim'; // regex.GLOBAL | regex.IGNORECASE | regex.MULTILINE

export default class Regex {
  constructor (hasCategoryTags, hasQuestionNumbers) {
    if (hasQuestionNumbers && hasCategoryTags) {
      this.QUESTION = new RegExp(/^ *\d{1,2}\.(?:.|\n)*?ANSWER(?:.|\n)*?<[^>]*>/, FLAGS);
    } else if (hasQuestionNumbers && !hasCategoryTags) {
      this.QUESTION = new RegExp(/\d{0,2}(?:[^\d\n].*\n)*[ \t]*ANSWER.*(?:\n.+)*?(?=\n\s*\d{1,2}|\n\s*$)/, FLAGS);
    } else {
      this.QUESTION = new RegExp(/(?:[^\n].*\n)*[ \t]*ANSWER.*(?:\n.*)*?(?=\n$)/, FLAGS);
    }

    this.CATEGORY_TAG = new RegExp(/<[^>]*>/, FLAGS);

    this.TOSSUP_TEXT = new RegExp(/(?<=\d{1,2}\.)(?:.|\n)*?(?=^ ?ANSWER|ANSWER:)/, FLAGS);
    this.TOSSUP_ANSWER = hasCategoryTags
      ? new RegExp(/(?<=ANSWER:|^ ?ANSWER)(?:.|\n)*(?=<[^>]*>)/, FLAGS)
      : new RegExp(/(?<=ANSWER:|^ ?ANSWER)(?:.|\n)*/, FLAGS);

    this.BONUS_LEADIN = new RegExp(/(?<=^ *\d{1,2}\.)(?:.|\n)*?(?=\[(?:10)?[EMH]?\])/, FLAGS);
    this.BONUS_PARTS = new RegExp(/(?<=\[(?:10)?[EMH]?\])(?:.|\n)*?(?=^ ?ANSWER|ANSWER:)/, FLAGS);
    this.BONUS_ANSWERS = new RegExp(/(?<=ANSWER:|^ ?ANSWER)(?:.|\n)*?(?=\[(?:10)?[EMH]?\]|<[^>]*>)/, FLAGS);
    this.BONUS_TAGS = new RegExp(/(?<=\[)\d{0,2}?[EMH]?(?=\])/, FLAGS);
  }
}

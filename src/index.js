import { classify, classifyQuestion } from './classifier/index.js';
import Regex from './regex.js';
import { escapeRegex, formatText, getAlternateSubcategory, getSubcategory, preprocessPacket, removeFormatting } from './utils.js';

import ALTERNATE_SUBCATEGORIES from './modules/alternate-subcategories.js';
import SUBCAT_TO_CAT from './modules/subcat-to-cat.js';
import SUBSUBCATEGORIES from './modules/subsubcategories.js';
import TEN_TYPOS from './modules/ten-typos.js';

import fs from 'fs';

class Parser {
  constructor ({
    hasCategoryTags,
    hasQuestionNumbers,
    alwaysClassify = false,
    autoInsertPowermarks = false,
    bonusLength = 3,
    buzzpoints = false,
    constantSubcategory = '',
    constantAlternateSubcategory = '',
    classifyUnknown,
    modaq,
    spacePowermarks
  }) {
    this.hasCategoryTags = hasCategoryTags;
    this.hasQuestionNumbers = hasQuestionNumbers;

    this.alwaysClassify = alwaysClassify;
    this.autoInsertPowermarks = autoInsertPowermarks;
    this.bonusLength = bonusLength;
    this.buzzpoints = buzzpoints;
    this.classifyUnknown = classifyUnknown;
    this.modaq = modaq;
    this.spacePowermarks = spacePowermarks;

    /**
     * 1-indexed
     */
    this.tossupIndex = 0;
    /**
     * 1-indexed
     */
    this.bonusIndex = 0;

    this.constantSubcategory = constantSubcategory;
    this.constantCategory = constantSubcategory ? SUBCAT_TO_CAT[constantSubcategory] : '';
    this.constantAlternateSubcategory = constantAlternateSubcategory;

    if (!this.hasCategoryTags && this.constantSubcategory !== '') {
      console.warn(`Using fixed category ${this.constantCategory} and subcategory ${this.constantSubcategory}`);
    }

    if (this.constantAlternateSubcategory) {
      console.warn(`Using fixed alternate subcategory ${this.constantAlternateSubcategory}`);
    }

    this.regex = new Regex(this.hasCategoryTags, this.hasQuestionNumbers);
  }

  /**
   *
   * @param {string} text
   * @returns
   */
  parse_tossup (text) {
    const [category, subcategory, alternateSubcategory, metadata] = this.parse_category(text, 'tossup');

    if (!this.hasCategoryTags) {
      text = text.replace(this.regex.CATEGORY_TAG, '');
    }

    const questionRawMatch = text.match(this.regex.TOSSUP_TEXT);
    if (!questionRawMatch) {
      console.error(`No question text for tossup ${this.tossupIndex} - ${text}`);
      process.exit(1);
    }

    let questionRaw = questionRawMatch[0];
    questionRaw = questionRaw.replace(/\n/g, ' ').trim();
    questionRaw = questionRaw.replace(/^\d{1,2}\./, '');
    questionRaw = questionRaw.trim();

    if (questionRaw.length === 0) {
      console.error(`Tossup ${this.tossupIndex} question text is empty - ${text}`);
      process.exit(1);
    }

    if ((questionRaw.match(/\(\*\)/g) || []).length >= 2) {
      console.warn(`Tossup ${this.tossupIndex} has multiple powermarks (*)`);
    }

    if (this.autoInsertPowermarks && !questionRaw.includes('(*)')) {
      questionRaw = this.insert_powermark(questionRaw);
    }

    if (questionRaw.startsWith('{b}{i} ')) {
      questionRaw = '{b}{i}' + questionRaw.slice(6);
    } else if (questionRaw.startsWith('{b} ')) {
      questionRaw = '{b}' + questionRaw.slice(4);
    } else if (questionRaw.startsWith('{i} ')) {
      questionRaw = '{i}' + questionRaw.slice(4);
    }

    let question = formatText(questionRaw, this.modaq);
    let questionSanitized = removeFormatting(questionRaw);

    if (questionSanitized.includes('(*)') && !questionSanitized.includes(' (*) ')) {
      if (this.spacePowermarks) {
        questionSanitized = questionSanitized.replace(/ *\(\*\) */g, ' (*) ');
        question = question.replace(/ *\(\*\) */g, ' (*) ');
      } else {
        console.warn(`Tossup ${this.tossupIndex} powermark (*) is not surrounded by spaces`);
      }
    }

    if (questionSanitized.toLowerCase().includes('answer:')) {
      console.warn(`Tossup ${this.tossupIndex} question text may contain the answer`);
      this.tossupIndex += 1;
    }

    const answerRawMatch = text.match(this.regex.TOSSUP_ANSWER);

    if (!answerRawMatch) {
      console.error(`Cannot find answer for tossup ${this.tossupIndex} - ${text}`);
      process.exit(1);
    }

    let answerRaw = answerRawMatch[0];
    answerRaw = answerRaw.replace(/\n/g, ' ').trim();
    if (answerRaw.startsWith(':')) {
      answerRaw = answerRaw.slice(1).trim();
    }

    if (answerRaw.toLowerCase().includes('answer:')) {
      console.warn(`Tossup ${this.tossupIndex} answer may contain the next question`);
      this.tossupIndex += 1;
      if (!this.hasCategoryTags) {
        console.log(`\n${answerRaw}\n`);
      }
    }

    const answer = formatText(answerRaw, this.modaq);
    const answerSanitized = removeFormatting(answerRaw);

    if (this.buzzpoints) {
      return {
        question,
        answer,
        answer_sanitized: answerSanitized,
        metadata
      };
    } else if (this.modaq) {
      return {
        question,
        answer,
        metadata
      };
    } else {
      const data = {
        question,
        question_sanitized: questionSanitized,
        answer,
        answer_sanitized: answerSanitized,
        category,
        subcategory,
        alternate_subcategory: alternateSubcategory
      };

      if (alternateSubcategory === '') {
        delete data.alternate_subcategory;
      }

      return data;
    }
  }

  /**
   *
   * @param {string} text
   * @returns
   */
  parse_bonus (text) {
    const [category, subcategory, alternateSubcategory, metadata] = this.parse_category(text, 'bonus');

    if (!this.hasCategoryTags) {
      text = text.replace(this.regex.CATEGORY_TAG, '');
    }

    const [difficultyModifiers, values] = this.parse_bonus_tags(text);

    for (const typo of TEN_TYPOS) {
      text = text.replace(new RegExp(escapeRegex(typo), 'gi'), '[10]');
    }

    const leadinRawMatch = text.match(this.regex.BONUS_LEADIN);

    if (!leadinRawMatch) {
      console.error(`Cannot find leadin for bonus ${this.bonusIndex} - ${text}`);
      process.exit(2);
    }

    let leadinRaw = leadinRawMatch[0];
    leadinRaw = leadinRaw.replace(/\n/g, ' ').trim();
    leadinRaw = leadinRaw.replace(/^\d{1,2}\./, '');
    leadinRaw = leadinRaw.trim();

    if (leadinRaw.startsWith('{b}{i} ')) {
      leadinRaw = '{b}{i}' + leadinRaw.slice(6);
    } else if (leadinRaw.startsWith('{b} ')) {
      leadinRaw = '{b}' + leadinRaw.slice(4);
    } else if (leadinRaw.startsWith('{i} ')) {
      leadinRaw = '{i}' + leadinRaw.slice(4);
    }

    const leadin = formatText(leadinRaw, this.modaq);
    const leadinSanitized = removeFormatting(leadinRaw);

    if (leadinSanitized.toLowerCase().includes('answer:')) {
      console.warn(`Bonus ${this.bonusIndex} leadin may contain the answer to the first part`);
      this.bonusIndex += 1;
      if (!this.hasQuestionNumbers) {
        console.log(`\n${leadinRaw}\n`);
      }
    }

    const partsRawMatches = text.match(this.regex.BONUS_PARTS) || [];

    if (partsRawMatches.length === 0) {
      console.error(`No parts found for bonus ${this.bonusIndex} - ${text}`);
      process.exit(2);
    }

    const partsRaw = partsRawMatches.map(part => part.replace(/\n/g, ' ').trim());
    const parts = partsRaw.map(part => formatText(part, this.modaq));
    const partsSanitized = partsRaw.map(part => removeFormatting(part));

    const answersRawMatches = (text + '\n[10]').match(this.regex.BONUS_ANSWERS) || [];

    if (answersRawMatches.length === 0) {
      console.error(`No answers found for bonus ${this.bonusIndex} - ${text}`);
      process.exit(2);
    }

    const answersRaw = answersRawMatches.map(answer => answer.replace(/\n/g, ' ').trim());
    const processedAnswersRaw = answersRaw.map(answer =>
      answer.startsWith(':') ? answer.slice(1).trim() : answer
    );
    const answers = processedAnswersRaw.map(answer => formatText(answer, this.modaq));
    const answersSanitized = processedAnswersRaw.map(answer => removeFormatting(answer));

    if (partsRaw.length !== answersRaw.length) {
      console.warn(`Bonus ${this.bonusIndex} has ${partsRaw.length} parts but ${answersRaw.length} answers`);
    }

    if (partsRaw.length < this.bonusLength && values.reduce((a, b) => a + b, 0) !== 30) {
      console.warn(`Bonus ${this.bonusIndex} has fewer than ${this.bonusLength} parts`);
      if (!this.hasQuestionNumbers) {
        console.log(`\n${text.slice(3)}\n`);
      }
    }

    if (partsRaw.length > this.bonusLength && values.reduce((a, b) => a + b, 0) !== 30) {
      console.warn(`Bonus ${this.bonusIndex} has more than ${this.bonusLength} parts`);
    }

    if (answersSanitized[answersSanitized.length - 1].toLowerCase().includes('answer:')) {
      console.warn(`Bonus ${this.bonusIndex} answer may contain the next tossup`);
      console.log(`\n${answersSanitized[answersSanitized.length - 1]}\n`);
    }

    if (this.buzzpoints) {
      const data = {
        values,
        leadin,
        leadin_sanitized: leadinSanitized,
        parts,
        parts_sanitized: partsSanitized,
        answers,
        answers_sanitized: answersSanitized,
        metadata,
        difficultyModifiers
      };

      if (difficultyModifiers.length === 0) {
        delete data.difficultyModifiers;
      }

      return data;
    } else if (this.modaq) {
      const data = {
        values,
        leadin,
        parts,
        answers,
        metadata,
        difficultyModifiers
      };

      if (difficultyModifiers.length === 0) {
        delete data.difficultyModifiers;
      }

      return data;
    } else {
      const data = {
        leadin,
        leadin_sanitized: leadinSanitized,
        parts,
        parts_sanitized: partsSanitized,
        answers,
        answers_sanitized: answersSanitized,
        category,
        subcategory,
        alternate_subcategory: alternateSubcategory,
        values,
        difficultyModifiers
      };

      if (alternateSubcategory === '') {
        delete data.alternate_subcategory;
      }

      if (values.length === 0) {
        delete data.values;
      }

      if (difficultyModifiers.length === 0) {
        delete data.difficultyModifiers;
      }

      return data;
    }
  }

  /**
   *
   * @param {string} text
   * @returns
   */
  insert_powermark (text) {
    const index = text.lastIndexOf('{/b}');
    if (index < 0) {
      console.warn(`Can't insert (*) for tossup ${this.tossupIndex} - ${text}`);
    }
    return text.slice(0, index) + '(*)' + text.slice(index);
  }

  /**
   * Parses the category, subcategory, alternate subcategory, and metadata from the given text.
   * Handles tossup and bonus types, and applies constant values if specified.
   *
   * @param {string} text - The input text to parse.
   * @param {string} type - The type of question, either "tossup" or "bonus".
   * @returns {[string, string, string, string]} A tuple containing category, subcategory, alternate subcategory, and metadata.
   */
  parse_category (text, type) {
    let category = '';
    let subcategory = '';
    let alternateSubcategory = '';
    let metadata = '';

    const index = type === 'tossup' ? this.tossupIndex : this.bonusIndex;

    const categoryTag = this.parse_category_tag(text);

    if (categoryTag) {
      [category, subcategory, alternateSubcategory, metadata] = categoryTag;
    } else if (this.hasCategoryTags) {
      console.error(`No category tag for ${type} ${index} - ${text}`);
      process.exit(3);
    }

    if (this.constantCategory && this.constantSubcategory) {
      category = this.constantCategory;
      subcategory = this.constantSubcategory;
    }

    if (this.constantAlternateSubcategory) {
      alternateSubcategory = this.constantAlternateSubcategory;
    }

    if (!subcategory && this.hasCategoryTags && !this.classifyUnknown) {
      console.error(`${type} ${index} has unrecognized subcategory ${categoryTag}`);
      process.exit(3);
    }

    if (!subcategory || (!this.hasCategoryTags && this.alwaysClassify)) {
      const [tempCategory, tempSubcategory, tempAlternateSubcategory] = classifyQuestion(text);

      category = tempCategory;
      subcategory = tempSubcategory;

      if (this.hasCategoryTags && !alternateSubcategory) {
        console.warn(`${type} ${index} classified as ${category} - ${subcategory}`);
      }

      if (!alternateSubcategory) {
        alternateSubcategory = tempAlternateSubcategory;
      }
    }

    if (!alternateSubcategory && !this.modaq) {
      if (category in ALTERNATE_SUBCATEGORIES) {
        alternateSubcategory = classify(text, { mode: 'alternate-subcategory', category });
      } else if (subcategory in SUBSUBCATEGORIES) {
        alternateSubcategory = classify(text, { mode: 'subsubcategory', subcategory });
      }
    }

    if (this.buzzpoints) {
      // Automatically generate metadata for buzzpoint-migrator
      metadata = '';
    }

    if (!metadata && alternateSubcategory) {
      metadata = `${category} - ${subcategory} - ${alternateSubcategory}`;
    }

    if (!metadata && !alternateSubcategory) {
      metadata = `${category} - ${subcategory}`;
    }

    return [category, subcategory, alternateSubcategory, metadata];
  }

  /**
   * Parses the category tag from the given text and extracts category, subcategory,
   * alternate subcategory, and metadata.
   *
   * @param {string} text - The input text to parse.
   * @returns {[string, string, string, string] | null} A tuple containing category, subcategory,
   * alternate subcategory, and metadata, or null if no category tag is found.
   */
  parse_category_tag (text) {
    // Remove formatting and search for the category tag using the regex
    let categoryTag = removeFormatting(text).match(this.regex.CATEGORY_TAG);

    if (!categoryTag) {
      return null;
    }

    categoryTag = categoryTag[0].trim().replace(/\n/g, ' ');
    const metadata = categoryTag.slice(1, -1); // Remove the first and last characters

    const subcategory = getSubcategory(categoryTag);
    const alternateSubcategory = getAlternateSubcategory(categoryTag);
    const category = subcategory ? SUBCAT_TO_CAT[subcategory] : '';

    return [category, subcategory, alternateSubcategory, metadata];
  }

  /**
   * Parses the bonus tags from the given text and extracts the difficulties and values.
   * If `this.modaq` or `this.buzzpoints` is true, the values will be set to 10 if no value is found.
   *
   * @param {string} text - The text to parse the bonus tags from.
   * @returns {[Array<"e" | "m" | "h">, number[]]} A tuple containing the difficulties and values.
   */
  parse_bonus_tags (text) {
    const tags = text.match(this.regex.BONUS_TAGS) || [];
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

    if (values.length === 0 && (this.modaq || this.buzzpoints)) {
      values = Array(tags.length).fill(10);
    }

    return [difficultyModifiers, values];
  }

  /**
   * Parses the packet text into tossups and bonuses.
   *
   * @param {string} text - The packet text to parse.
   * @param {string} name - The name of the packet (optional).
   * @returns {Object} An object containing tossups and bonuses.
   */
  parse_packet (text, name = '') {
    this.tossupIndex = 1;
    this.bonusIndex = 1;

    if (this.modaq) {
      text = text.replace(/"/g, '\u0022');
    }

    text = preprocessPacket(text);

    const questions = text.match(this.regex.QUESTION) || [];

    const tossups = [];
    const bonuses = [];

    for (let question of questions) {
      const isBonus = question.match(this.regex.BONUS_TAGS);

      if ((!this.hasQuestionNumbers) ^ (question.match(/^\d{1,2}\./) ? 1 : 0)) {
        question = '1. ' + question;
      }

      if (isBonus) {
        bonuses.push(question);
      } else {
        tossups.push(question);
      }
    }

    if (name) {
      console.log(`Found ${tossups.length.toString().padStart(2)} tossups and ${bonuses.length.toString().padStart(2)} bonuses in ${name}`);
    }

    const data = {
      tossups: [],
      bonuses: []
    };

    let missingDirectives = (text.match(/description acceptable/g) || []).length;
    const unsanitized = this.modaq || this.buzzpoints;

    for (const tossup of tossups) {
      const tossupParsed = this.parse_tossup(tossup);
      data.tossups.push(tossupParsed);
      this.tossupIndex += 1;
      const questionText = unsanitized ? tossupParsed.question : tossupParsed.question_sanitized;
      missingDirectives -= (questionText.toLowerCase().includes('description acceptable') ? 1 : 0);
    }

    for (const bonus of bonuses) {
      const bonusParsed = this.parse_bonus(bonus);
      data.bonuses.push(bonusParsed);
      this.bonusIndex += 1;
      const leadinText = unsanitized ? bonusParsed.leadin : bonusParsed.leadin_sanitized;
      missingDirectives -= (leadinText.toLowerCase().includes('description acceptable') ? 1 : 0);
      for (const part of (unsanitized ? bonusParsed.parts : bonusParsed.parts_sanitized)) {
        missingDirectives -= (part.toLowerCase().includes('description acceptable') ? 1 : 0);
      }
    }

    if (missingDirectives > 0) {
      console.warn(`${missingDirectives} 'description acceptable' directive(s) may not have parsed in this packet`);
    }

    return data;
  }
}

function main () {
  const parser = new Parser({ hasCategoryTags: true, hasQuestionNumbers: true });
  fs.mkdirSync('./output', { recursive: true });
  for (const filename of fs.readdirSync('./packets')) {
    const text = fs.readFileSync(`./packets/${filename}`, 'utf-8');
    const data = parser.parse_packet(text, filename);
    fs.writeFileSync(`./output/${filename.replace('.txt', '.json')}`, JSON.stringify(data));
  }
}

// equivalent to `if __name__ == '__main__':` in Python
let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

import { classifyText, classifyQuestion } from './classifier/index.js';
import Regex from './regex.js';
import { escapeRegex, formatText, getAlternateSubcategory, getSubcategory, preprocessPacket, removeFormatting } from './utils.js';

import { ALTERNATE_SUBCATEGORIES, SUBSUBCATEGORIES } from './constants/categories.js';
import SUBCAT_TO_CAT from './constants/subcat-to-cat.js';
import TEN_TYPOS from './constants/ten-typos.js';
import convertDocx from './converters/docx.js';

/**
 * A parser for quizbowl packets.
 * Functions in this class may throw Errors if the input text is not formatted correctly,
 * or log warnings using `this.warn` if the input text contains potential issues.
 */
export default class Parser {
  constructor ({
    hasCategoryTags,
    hasQuestionNumbers,
    alwaysClassify = false,
    autoInsertPowermarks = false,
    bonusLength = 3,
    buzzpoints = false,
    constantSubcategory = '',
    constantAlternateSubcategory = '',
    classifyUnknown = true,
    modaq = false,
    spacePowermarks = false,
    verbose = false
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
    this.verbose = verbose;

    this.warnings = [];

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
      this.warn(`Using fixed category ${this.constantCategory} and subcategory ${this.constantSubcategory}`);
    }

    if (this.constantAlternateSubcategory) {
      this.warn(`Using fixed alternate subcategory ${this.constantAlternateSubcategory}`);
    }

    this.regex = new Regex(this.hasCategoryTags, this.hasQuestionNumbers);
  }

  warn (message) {
    this.warnings.push(message);
    if (this.verbose) { console.warn(message); }
  }

  /**
   *
   * @param {string} text
   * @returns
   */
  parseTossup (text) {
    const [category, subcategory, alternateSubcategory, metadata] = this.parseCategory(text, 'tossup');

    if (!this.hasCategoryTags) {
      text = text.replace(this.regex.CATEGORY_TAG, '');
    }

    const questionRawMatch = text.match(this.regex.TOSSUP_TEXT);
    if (!questionRawMatch) {
      throw new Error(`No question text for tossup ${this.tossupIndex} - ${text}`);
    }

    let questionRaw = questionRawMatch[0];
    questionRaw = questionRaw.replace(/\n/g, ' ').trim();
    questionRaw = questionRaw.replace(/^\d{1,2}\./, '');
    questionRaw = questionRaw.trim();

    if (questionRaw.length === 0) {
      throw new Error(`Tossup ${this.tossupIndex} question text is empty - ${text}`);
    }

    if ((questionRaw.match(/\(\*\)/g) || []).length >= 2) {
      this.warn(`Tossup ${this.tossupIndex} has multiple powermarks (*)`);
    }

    if (this.autoInsertPowermarks && !questionRaw.includes('(*)')) {
      questionRaw = this.insertPowermark(questionRaw);
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
        this.warn(`Tossup ${this.tossupIndex} powermark (*) is not surrounded by spaces`);
      }
    }

    if (questionSanitized.toLowerCase().includes('answer:')) {
      this.warn(`Tossup ${this.tossupIndex} question text may contain the answer`);
      this.tossupIndex += 1;
    }

    const answerRawMatch = text.match(this.regex.TOSSUP_ANSWER);

    if (!answerRawMatch) {
      throw new Error(`Cannot find answer for tossup ${this.tossupIndex} - ${text}`);
    }

    let answerRaw = answerRawMatch[0];
    answerRaw = answerRaw.replace(/\n/g, ' ').trim();
    if (answerRaw.startsWith(':')) {
      answerRaw = answerRaw.slice(1).trim();
    }

    if (answerRaw.toLowerCase().includes('answer:')) {
      this.warn(`Tossup ${this.tossupIndex} answer may contain the next question`);
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
  parseBonus (text) {
    const [category, subcategory, alternateSubcategory, metadata] = this.parseCategory(text, 'bonus');

    if (!this.hasCategoryTags) {
      text = text.replace(this.regex.CATEGORY_TAG, '');
    }

    const [difficultyModifiers, values] = this.parseBonusTags(text);

    for (const typo of TEN_TYPOS) {
      text = text.replace(new RegExp(escapeRegex(typo), 'gi'), '[10]');
    }

    const leadinRawMatch = text.match(this.regex.BONUS_LEADIN);

    if (!leadinRawMatch) {
      throw new Error(`Cannot find leadin for bonus ${this.bonusIndex} - ${text}`);
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
      this.warn(`Bonus ${this.bonusIndex} leadin may contain the answer to the first part`);
      this.bonusIndex += 1;
      if (!this.hasQuestionNumbers) {
        console.log(`\n${leadinRaw}\n`);
      }
    }

    const partsRawMatches = text.match(this.regex.BONUS_PARTS) || [];

    if (partsRawMatches.length === 0) {
      throw new Error(`No parts found for bonus ${this.bonusIndex} - ${text}`);
    }

    const partsRaw = partsRawMatches.map(part => part.replace(/\n/g, ' ').trim());
    const parts = partsRaw.map(part => formatText(part, this.modaq));
    const partsSanitized = partsRaw.map(part => removeFormatting(part));

    const answersRawMatches = (text + '\n[10]').match(this.regex.BONUS_ANSWERS) || [];

    if (answersRawMatches.length === 0) {
      throw new Error(`No answers found for bonus ${this.bonusIndex} - ${text}`);
    }

    const answersRaw = answersRawMatches.map(answer => answer.replace(/\n/g, ' ').trim());
    const processedAnswersRaw = answersRaw.map(answer =>
      answer.startsWith(':') ? answer.slice(1).trim() : answer
    );
    const answers = processedAnswersRaw.map(answer => formatText(answer, this.modaq));
    const answersSanitized = processedAnswersRaw.map(answer => removeFormatting(answer));

    if (partsRaw.length !== answersRaw.length) {
      this.warn(`Bonus ${this.bonusIndex} has ${partsRaw.length} parts but ${answersRaw.length} answers`);
    }

    if (partsRaw.length < this.bonusLength && values.reduce((a, b) => a + b, 0) !== 30) {
      this.warn(`Bonus ${this.bonusIndex} has fewer than ${this.bonusLength} parts`);
      if (!this.hasQuestionNumbers) {
        console.log(`\n${text.slice(3)}\n`);
      }
    }

    if (partsRaw.length > this.bonusLength && values.reduce((a, b) => a + b, 0) !== 30) {
      this.warn(`Bonus ${this.bonusIndex} has more than ${this.bonusLength} parts`);
    }

    if (answersSanitized[answersSanitized.length - 1].toLowerCase().includes('answer:')) {
      this.warn(`Bonus ${this.bonusIndex} answer may contain the next tossup`);
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
  insertPowermark (text) {
    const index = text.lastIndexOf('{/b}');
    if (index < 0) {
      this.warn(`Can't insert (*) for tossup ${this.tossupIndex} - ${text}`);
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
  parseCategory (text, type) {
    let category = '';
    let subcategory = '';
    let alternateSubcategory = '';
    let metadata = '';

    const index = type === 'tossup' ? this.tossupIndex : this.bonusIndex;

    const categoryTag = this.parseCategoryTag(text);

    if (categoryTag) {
      [category, subcategory, alternateSubcategory, metadata] = categoryTag;
    } else if (this.hasCategoryTags) {
      throw new Error(`No category tag for ${type} ${index} - ${text}`);
    }

    if (this.constantCategory && this.constantSubcategory) {
      category = this.constantCategory;
      subcategory = this.constantSubcategory;
    }

    if (this.constantAlternateSubcategory) {
      alternateSubcategory = this.constantAlternateSubcategory;
    }

    if (!subcategory && this.hasCategoryTags && !this.classifyUnknown) {
      throw new Error(`${type} ${index} has unrecognized subcategory ${categoryTag}`);
    }

    if (!subcategory || (!this.hasCategoryTags && this.alwaysClassify)) {
      const [tempCategory, tempSubcategory, tempAlternateSubcategory] = classifyQuestion(text);

      category = tempCategory;
      subcategory = tempSubcategory;

      if (this.hasCategoryTags && !alternateSubcategory) {
        this.warn(`${type} ${index} classified as ${category} - ${subcategory}`);
      }

      if (!alternateSubcategory) {
        alternateSubcategory = tempAlternateSubcategory;
      }
    }

    if (!alternateSubcategory && !this.modaq) {
      if (Object.prototype.hasOwnProperty.call(ALTERNATE_SUBCATEGORIES, category)) {
        alternateSubcategory = classifyText(text, { mode: 'alternate-subcategory', category });
      } else if (Object.prototype.hasOwnProperty.call(SUBSUBCATEGORIES, subcategory)) {
        alternateSubcategory = classifyText(text, { mode: 'subsubcategory', subcategory });
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
  parseCategoryTag (text) {
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
  parseBonusTags (text) {
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
   * @param {string} text - The packet text to parse.
   * @param {string} name - The name of the packet (optional).
   * @returns {{
   *  data: {tossups: [], bonuses: []},
   *  warnings: string[]
   * }} An object containing tossups and bonuses, and any warnings.
   */
  parsePacket (text, name = '') {
    this.tossupIndex = 1;
    this.bonusIndex = 1;
    this.warnings = [];

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
      const tossupParsed = this.parseTossup(tossup);
      data.tossups.push(tossupParsed);
      this.tossupIndex += 1;
      const questionText = unsanitized ? tossupParsed.question : tossupParsed.question_sanitized;
      missingDirectives -= (questionText.toLowerCase().includes('description acceptable') ? 1 : 0);
    }

    for (const bonus of bonuses) {
      const bonusParsed = this.parseBonus(bonus);
      data.bonuses.push(bonusParsed);
      this.bonusIndex += 1;
      const leadinText = unsanitized ? bonusParsed.leadin : bonusParsed.leadin_sanitized;
      missingDirectives -= (leadinText.toLowerCase().includes('description acceptable') ? 1 : 0);
      for (const part of (unsanitized ? bonusParsed.parts : bonusParsed.parts_sanitized)) {
        missingDirectives -= (part.toLowerCase().includes('description acceptable') ? 1 : 0);
      }
    }

    if (missingDirectives > 0) {
      this.warn(`${missingDirectives} 'description acceptable' directive(s) may not have parsed in this packet - consider moving any directives *after* the question number`);
    }

    return { data, warnings: this.warnings };
  }

  /**
   *
   * @param {object} input - see the documentation for `convertDocx`
   * @returns
   */
  async parseDocxPacket (input, name = '') {
    // check if docx is arraybuffer
    let text;
    if (input instanceof ArrayBuffer) {
      text = await convertDocx({ arrayBuffer: input });
    } else if (input instanceof Buffer) {
      text = await convertDocx({ buffer: input });
    } else if (typeof input === 'string') {
      text = await convertDocx({ path: input });
    } else {
      throw new Error('Invalid input type');
    }
    return this.parsePacket(text, name);
  }
}

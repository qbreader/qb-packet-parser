#!/usr/bin/env node

import Parser from '../src/index.js';
import fs from 'fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import { ALTERNATE_SUBCATEGORY_LIST } from '../src/constants/category-alternate-subcategory.js';
import { CATEGORY_LIST, SUBCATEGORY_LIST } from '../src/constants/category-subcategory.js';
import { SUBSUBCATEGORY_LIST } from '../src/constants/subcategory-subsubcategory.js';

/**
 * `constantAlternateSubcategory` fills the same field as both alternate subcategories
 * and subsubcategories, so both are valid values.
 */
const CONSTANT_ALTERNATE_SUBCATEGORY_LIST = [...ALTERNATE_SUBCATEGORY_LIST, ...SUBSUBCATEGORY_LIST];

/**
 * The yargs options that map onto the `Parser` constructor.
 * Every key here MUST be a parameter of the constructor, and every parameter of the
 * constructor MUST appear here - `parserOptionsFrom` forwards exactly these keys.
 * The defaults are duplicated from the constructor so that they show up in `--help`.
 */
const PARSER_OPTIONS = {
  hasCategoryTags: {
    alias: 'c',
    describe: 'Whether the packet contains category tags',
    type: 'boolean',
    default: true
  },
  hasQuestionNumbers: {
    alias: 'n',
    describe: 'Whether the packet contains question numbers',
    type: 'boolean',
    default: true
  },
  alwaysClassify: {
    alias: 'a',
    describe: 'Always auto-classify categories, even if a category tag is detected',
    type: 'boolean',
    default: false
  },
  autoInsertPowermarks: {
    alias: 'p',
    describe: 'Insert powermarks into questions that are bolded in power but have no explicit powermark',
    type: 'boolean',
    default: false
  },
  bonusLength: {
    alias: 'e',
    describe: 'The expected number of parts in a bonus',
    type: 'number',
    default: 3
  },
  buzzpoints: {
    alias: 'b',
    describe: 'Output in a format compatible with buzzpoints. Cannot be used with --modaq',
    type: 'boolean',
    default: false
  },
  classifyUnknown: {
    describe: 'Auto-classify unrecognized categories in tags instead of erroring',
    type: 'boolean',
    default: true
  },
  constantCategory: {
    describe: `Use this category for every question. Cannot be used with --constantSubcategory. One of: ${CATEGORY_LIST.join(', ')}`,
    type: 'string',
    default: ''
  },
  constantSubcategory: {
    describe: `Use this subcategory (and its category) for every question. One of: ${SUBCATEGORY_LIST.join(', ')}`,
    type: 'string',
    default: ''
  },
  constantAlternateSubcategory: {
    describe: `Use this alternate subcategory for every question. One of: ${CONSTANT_ALTERNATE_SUBCATEGORY_LIST.join(', ')}`,
    type: 'string',
    default: ''
  },
  modaq: {
    alias: 'm',
    describe: 'Output in a format compatible with MODAQ. Cannot be used with --buzzpoints',
    type: 'boolean',
    default: false
  },
  noQuestionUnderlining: {
    alias: 'u',
    describe: 'Remove underlining from (non-answer) question text instead of warning about it',
    type: 'boolean',
    default: false
  },
  spacePowermarks: {
    alias: 's',
    describe: 'Ensure powermarks are surrounded by spaces instead of warning about them',
    type: 'boolean',
    default: false
  },
  verbose: {
    alias: 'v',
    describe: 'Print warnings to stderr as they occur. Use --no-verbose to suppress them',
    type: 'boolean',
    default: true
  }
};

/**
 * @param {string} name the option name, for the error message
 * @param {string} value
 * @param {string[]} allowed
 */
function checkChoice (name, value, allowed) {
  if (value !== '' && !allowed.includes(value)) {
    throw new Error(`Invalid value "${value}" for --${name}. Choose one of: ${allowed.join(', ')}`);
  }
}

/**
 * @param {object} argv the parsed yargs arguments
 * @returns {object} only the keys that the `Parser` constructor accepts
 */
function parserOptionsFrom (argv) {
  const options = {};
  for (const key of Object.keys(PARSER_OPTIONS)) {
    options[key] = argv[key];
  }
  return options;
}

async function main () {
  const argv = yargs(hideBin(process.argv))
    .command('$0 <filename>', 'Parse a .txt file into JSON on stdout', (yargs) => {
      yargs.positional('filename', {
        describe: 'The path to the .txt file to parse',
        type: 'string'
      });
    })
    .options(PARSER_OPTIONS)
    .check((argv) => {
      if (argv.modaq && argv.buzzpoints) {
        throw new Error('Cannot output in both MODAQ and buzzpoints formats.');
      }

      if (argv.constantCategory && argv.constantSubcategory) {
        throw new Error('Cannot use both a constant category and a constant subcategory.');
      }

      checkChoice('constantCategory', argv.constantCategory, CATEGORY_LIST);
      checkChoice('constantSubcategory', argv.constantSubcategory, SUBCATEGORY_LIST);
      checkChoice('constantAlternateSubcategory', argv.constantAlternateSubcategory, CONSTANT_ALTERNATE_SUBCATEGORY_LIST);

      if (!Number.isInteger(argv.bonusLength) || argv.bonusLength < 1) {
        throw new Error(`--bonusLength must be a positive integer, but got "${argv.bonusLength}".`);
      }

      return true;
    })
    .strict()
    .help()
    .argv;

  try {
    const parser = new Parser(parserOptionsFrom(argv));
    const { data } = await parser.parsePacket(fs.readFileSync(argv.filename, 'utf8'), argv.filename);
    console.log(JSON.stringify(data, null, 4));
  } catch (e) {
    console.error(`Error parsing ${argv.filename}: ${e.message}`);
    process.exitCode = 1;
  }
}

// equivalent to `if __name__ == '__main__':` in Python
let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

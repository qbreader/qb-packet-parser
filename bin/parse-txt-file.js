#!/usr/bin/env node

import Parser from '../src/index.js';
import fs from 'fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

async function main () {
  const argv = yargs(hideBin(process.argv))
    .command('$0 <filename>', 'Convert a .docx file to a string compatible with the parser', (yargs) => {
      yargs.positional('filename', {
        describe: 'The path to the .docx file to convert',
        type: 'string'
      });
    }
    ).option('hasCategoryTags', {
      alias: 'c',
      describe: 'Whether the .docx file contains category tags',
      type: 'boolean',
      default: true
    })
    .option('hasQuestionNumbers', {
      alias: 'n',
      describe: 'Whether the .docx file contains question numbers',
      type: 'boolean',
      default: true
    })
    .help()
    .argv;

  const parser = new Parser({ hasCategoryTags: argv.hasCategoryTags, hasQuestionNumbers: argv.hasQuestionNumbers });
  try {
    const { data, warnings } = await parser.parsePacket(fs.readFileSync(argv.filename, 'utf8'));
    console.log(JSON.stringify(data, null, 4));
    if (warnings.length > 0) { console.warn(warnings); }
  } catch (e) {
    console.error(`Error parsing ${argv.filename}: ${e.message}`);
  }
}

// equivalent to `if __name__ == '__main__':` in Python
let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

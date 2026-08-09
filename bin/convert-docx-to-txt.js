import convertDocx from '../src/converters/docx.js';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

async function main () {
  const argv = yargs(hideBin(process.argv))
    .command('$0 <filename>', 'Convert a .docx file to a string compatible with the parser', (yargs) => {
      yargs.positional('filename', {
        describe: 'The path to the .docx file to convert',
        type: 'string'
      });
    })
    .help()
    .argv;

  const filename = argv.filename;
  if (typeof filename !== 'string') {
    throw new Error('Missing filename argument');
  }

  const text = await convertDocx({ path: filename });
  process.stdout.write(text);
  if (!text.endsWith('\n')) {
    process.stdout.write('\n');
  }
}

let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

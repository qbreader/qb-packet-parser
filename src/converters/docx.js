import fs from 'fs/promises';
import mammoth from 'mammoth';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Convert a .docx file to a string compatible with the parser.
 * @param {object} input - an object describing the source document.
 * On node.js, the following inputs are supported:
 * - `{path: path}`, where path is the path to the .docx file.
 * - `{buffer: buffer}`, where buffer is a node.js Buffer containing a .docx file.
 *
 * In the browser, the following inputs are supported:
 * - `{arrayBuffer: arrayBuffer}`, where arrayBuffer is an array buffer containing a .docx file.
 *
 * See the [mammoth documentation](https://www.npmjs.com/package/mammoth#api) for more information.
 * @returns
 */
export default async function convertDocx (input) {
  const result = await mammoth.convertToHtml(
    input,
    {
      styleMap: [
        'b => b',
        'i => i',
        'u => u'
      ],
      includeDefaultStyleMap: false,
      includeEmbeddedStyleMap: false,
      ignoreEmptyParagraphs: false
    }
  );

  return result.value
    .replaceAll('<p>', '')
    .replaceAll('</p>', '\n')
    .replaceAll('<br />', '\n')
    .replace(/<\/?sub>/g, '\n')
    .replace(/<\/?sup>/g, '\n')
    // convert bold, italic, and underline to internal representation
    .replaceAll('<b>', '{b}')
    .replaceAll('</b>', '{/b}')
    .replaceAll('<i>', '{i}')
    .replaceAll('</i>', '{/i}')
    .replaceAll('<u>', '{u}')
    .replaceAll('</u>', '{/u}')
    // handle HTML escape characters
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&#39;', "'");
}

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
  const outputFilename = filename.replace(/\.docx$/i, '.txt');
  await fs.writeFile(outputFilename, text.endsWith('\n') ? text : `${text}\n`);
  console.log(`Converted ${filename} -> ${outputFilename}`);
}

let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

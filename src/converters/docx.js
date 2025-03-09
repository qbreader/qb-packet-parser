import mammoth from 'mammoth';

/**
 * Convert a .docx file to a string compatible with the parser.
 * @param {mammoth.Input} input - an object describing the source document.
 * On node.js, the following inputs are supported:
 * - {path: path}, where path is the path to the .docx file.
 * - {buffer: buffer}, where buffer is a node.js Buffer containing a .docx file.
 *
 * In the browser, the following inputs are supported:
 * - {arrayBuffer: arrayBuffer}, where arrayBuffer is an array buffer containing a .docx file.
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

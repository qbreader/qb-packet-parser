import convertDocx from './src/converters/docx.js';
import Parser from './src/index.js';

import fs from 'fs';

async function main () {
  const parser = new Parser({ hasCategoryTags: true, hasQuestionNumbers: false });
  fs.mkdirSync('./packets', { recursive: true });
  fs.mkdirSync('./output', { recursive: true });
  for (const filename of fs.readdirSync('./p-docx')) {
    const text = await convertDocx({ path: `./p-docx/${filename}` });
    fs.writeFileSync(`./packets/${filename.replace('.docx', '.txt')}`, text);
    try {
      const data = parser.parse_packet(text, filename);
      fs.writeFileSync(`./output/${filename.replace('.docx', '.json')}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Error parsing ${filename}: ${e.message}`);
    }
  }
}

// equivalent to `if __name__ == '__main__':` in Python
let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

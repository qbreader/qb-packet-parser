import Parser from './src/index.js';

import fs from 'fs';

async function main () {
  const parser = new Parser({ hasCategoryTags: true, hasQuestionNumbers: false });
  fs.mkdirSync('./packets', { recursive: true });
  fs.mkdirSync('./output', { recursive: true });
  for (const filename of fs.readdirSync('./p-docx')) {
    try {
      const { data, warnings } = await parser.parseDocxPacket(`./p-docx/${filename}`, filename);
      fs.writeFileSync(`./output/${filename.replace('.docx', '.json')}`, JSON.stringify(data));
      if (warnings.length > 0) { console.warn(warnings); }
    } catch (e) {
      console.error(`Error parsing ${filename}: ${e.message}`);
    }
  }
}

// equivalent to `if __name__ == '__main__':` in Python
let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

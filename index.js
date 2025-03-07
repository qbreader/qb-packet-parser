import Parser from './src/index.js';

import fs from 'fs';

function main () {
  const parser = new Parser({ hasCategoryTags: true, hasQuestionNumbers: true });
  fs.mkdirSync('./output', { recursive: true });
  for (const filename of fs.readdirSync('./packets')) {
    const text = fs.readFileSync(`./packets/${filename}`, 'utf-8');
    try {
      const data = parser.parse_packet(text, filename);
      fs.writeFileSync(`./output/${filename.replace('.txt', '.json')}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Error parsing ${filename}: ${e.message}`);
    }
  }
}

// equivalent to `if __name__ == '__main__':` in Python
let works;
try { works = process.argv[1] === import.meta?.filename; } catch (e) { works = false; }
if (works) { main(); }

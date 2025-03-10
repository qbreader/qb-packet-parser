The qbreader packet parser (https://github.com/qbreader/packet-parser), but in javascript.

# Usage

A small demonstration is included in `index.js` in the root of this repository.
To use it, download the zip file of [2025 ACF Regionals](https://collegiate.quizbowlpackets.com/3210/) that contains .docx files,
and rename the extracted folder to `p-docx` and place it in the root of this repository.
Then, the output will appear in a newly created `output/` folder.

## Browser

Load the Parser class directly from `dist/main.browser.mjs` like so:

```js
import Parser from "https://cdn.jsdelivr.net/npm/qb-packet-parser/dist/main.browser.mjs";
const parser = new Parser({ hasCategoryTags: true, hasQuestionNumbers: true });
```

## NodeJS

Load the Parser class directly from `src/index.js`, or use `dist/main.node.mjs`.
See `./index.js` for an example.

# Build

Build from `src` using `npm run build`.
Takes around 2.5 minutes/target when mode is set to "production" and around 2 seconds/target when mode is set to "development" in webpack.config.js.

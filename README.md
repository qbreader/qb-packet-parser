The qbreader packet parser, written in javascript.

# Usage

## Local

1. Run `./bin/download-set.sh` and follow the prompts to download a set.
2. Run `./bin/convert-to-txt.sh`
3. Run `./bin/parse-all-txt-files.sh`

## Browser

Load the Parser class directly from `dist/main.browser.mjs` like so:

```js
import Parser from "https://cdn.jsdelivr.net/npm/qb-packet-parser/dist/main.browser.mjs";
const parser = new Parser({ hasCategoryTags: true, hasQuestionNumbers: true });
// file-input is a <input type="file" id="file-input>
const file = document.getElementById('file-input').files[0];
const arrayBuffer = await file.arrayBuffer();
// data contains the parsed packet in JSON form
const { data, warnings } = await parser.parseDocxPacket(arrayBuffer, file.name);
```

## Command line

`./bin/parse-txt-file.js` parses a single `.txt` file and prints the resulting JSON to stdout.
Every parameter of the `Parser` constructor is available as a command line option.
Run `./bin/parse-txt-file.js --help` to see all flags.

```
./bin/parse-txt-file.js packets/packet.txt [options]
```

Booleans default to `true` when passed as a bare flag and can be negated with the `--no-` prefix,
so `--no-hasCategoryTags` is equivalent to `--hasCategoryTags false`.

`./bin/parse-all-txt-files.sh` parses every `.txt` file in `packets/` into `output/`, and forwards
any extra arguments to `parse-txt-file.js`:

```
./bin/parse-all-txt-files.sh --modaq --no-verbose
```

# Build

Build from `src` using `npm run build`.
Takes around 2.5 minutes/target when mode is set to "production" and around 2 seconds/target when mode is set to "development" in webpack.config.js.

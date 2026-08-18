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
Every parameter of the `Parser` constructor is available as a command line option, in either
camelCase (`--constantSubcategory`) or kebab-case (`--constant-subcategory`) form:

```
./bin/parse-txt-file.js packets/packet.txt [options]
```

| Option | Alias | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--hasCategoryTags` | `-c` | boolean | `true` | Whether the packet contains category tags |
| `--hasQuestionNumbers` | `-n` | boolean | `true` | Whether the packet contains question numbers |
| `--alwaysClassify` | `-a` | boolean | `false` | Always auto-classify categories, even if a category tag is detected |
| `--autoInsertPowermarks` | `-p` | boolean | `false` | Insert powermarks into questions that are bolded in power but have no explicit powermark |
| `--bonusLength` | `-e` | number | `3` | The expected number of parts in a bonus |
| `--buzzpoints` | `-b` | boolean | `false` | Output in a format compatible with buzzpoints. Cannot be used with `--modaq` |
| `--classifyUnknown` | | boolean | `true` | Auto-classify unrecognized categories in tags instead of erroring |
| `--constantCategory` | | string | `""` | Use this category for every question. Cannot be used with `--constantSubcategory` |
| `--constantSubcategory` | | string | `""` | Use this subcategory (and its category) for every question |
| `--constantAlternateSubcategory` | | string | `""` | Use this alternate subcategory for every question |
| `--modaq` | `-m` | boolean | `false` | Output in a format compatible with MODAQ. Cannot be used with `--buzzpoints` |
| `--noQuestionUnderlining` | `-u` | boolean | `false` | Remove underlining from (non-answer) question text instead of warning about it |
| `--spacePowermarks` | `-s` | boolean | `false` | Ensure powermarks are surrounded by spaces instead of warning about them |
| `--verbose` | `-v` | boolean | `true` | Print warnings to stderr as they occur. Use `--no-verbose` to suppress them |

Booleans default to `true` when passed as a bare flag and can be negated with the `--no-` prefix,
so `--no-hasCategoryTags` is equivalent to `--hasCategoryTags false`.
Run `./bin/parse-txt-file.js --help` for the allowed values of the `--constant*` options.

`./bin/parse-all-txt-files.sh` parses every `.txt` file in `packets/` into `output/`, and forwards
any extra arguments to `parse-txt-file.js`:

```
./bin/parse-all-txt-files.sh --modaq --no-verbose
```

# Build

Build from `src` using `npm run build`.
Takes around 2.5 minutes/target when mode is set to "production" and around 2 seconds/target when mode is set to "development" in webpack.config.js.

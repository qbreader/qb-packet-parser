#!/bin/bash

mkdir -p output

find packets -maxdepth 1 -type f -name '*.txt' -print0 | while IFS= read -r -d '' filename; do
    basename=$(basename "$filename")
    echo "Parsing ${basename}"
    ./bin/parse-txt-file.js "$filename" "$@" > "output/${basename%.txt}.json"
done

#!/bin/bash

for arg in "$@"; do
    case "$arg" in
        -h|--help)
            echo "Printing help for parse-txt-file.js..."
            ./bin/parse-txt-file.js --help
            exit 0
            ;;
    esac
done

mkdir -p output

find packets -maxdepth 1 -type f -name '*.txt' -print0 | sort -z | while IFS= read -r -d '' filename; do
    basename=$(basename "$filename")
    echo "Parsing ${basename}"
    ./bin/parse-txt-file.js "$filename" "$@" > "output/${basename%.txt}.json"
done

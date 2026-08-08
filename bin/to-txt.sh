#!/bin/bash

##### Convert all files to .txt, and for .docx and .pdf also get the answerline formatting #####
if [ -z "$TYPE" ]; then
    read -p "File type (p = pdf, d = docx, c = doc): " TYPE
    case $TYPE in
        p | pdf) TYPE="pdf" ;;
        d | docx) TYPE="docx" ;;
        c | doc) TYPE="doc" ;;
        *) echo "Invalid file type" && exit 1 ;;
    esac
fi

echo "Parsing ${TYPE} to text..."
mkdir -p "packets"

counter=0
for filename in p-$TYPE/*.$TYPE; do
    echo "Parsing ${filename}..."
    counter=$((counter+1))
    BASENAME=$(echo "${filename}" | cut -d'/' -f 2)
    case $TYPE in
        pdf) python3 src/converters/pdf-to-docx.py "$filename" && node src/converters/docx.js "${filename%.pdf}.docx" > "packets/${BASENAME%.pdf}.txt";;
        docx) node src/converters/docx.js "${filename}" > "packets/${BASENAME%.docx}.txt" ;;
    esac
done
echo "Parsed ${counter} ${TYPE}s."

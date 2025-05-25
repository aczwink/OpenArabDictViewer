for fn in dictionaries/*; do
    filename=$(basename -- "$fn")
    filename="${filename%.*}"
    js-yaml ./$fn > ./dist/$filename.json;
done
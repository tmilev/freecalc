#!/bin/sh
mkdir ./pictures
ls -d */ | sed -e 's/\///g' -e '/pictures/d' | while read line
do
cp ${line}/pictures/*.pdf ./pictures
sed 's/[^\/]*\/pictures/pictures/g' ${line}/*.tex > ./${line}.tex
rm -r ${line}
done 
rm playscript.sh

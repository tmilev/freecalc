#!/bin/sh
# a script for automating the compilation of several lectures at once
for i in 14 # put the numbers of the lectures that you want to compile here
do
sed s/includeonlylecture{[0-9]*}/includeonlylecture{$i}/g lecture-2015-spring.tex > temp.tex # replace lecture-2015-spring.tex with the name of your lecture file
pdflatex --shell-escape temp.tex
pdflatex --shell-escape temp.tex
if [ "$i" -le 9 ]
then
zero="0"
else
zero=""
fi
mv temp.pdf $zero$i.pdf
rm temp*
done 

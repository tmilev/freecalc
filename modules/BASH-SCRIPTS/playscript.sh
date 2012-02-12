#!/bin/sh
grep -n '% begin module' $1 > linelist1
grep -n 'includegraphics' $1 >linelist2
grep -n '% end module' $1 > linelist3
grep -n '\\section' $1 > linelist4
grep -n '\\subsection' $1 > linelist5
cat linelist1 linelist2 linelist3 linelist4 linelist5 | sed -e 's/^\([0-9]\):/0\1:/g' -e 's/^\([0-9][0-9]\):/0\1:/g' -e 's/\\/\\\\/g' | sort > linelist
rm linelist[1-5]

sed '/^\\end{document}/d' ~/Documents/calculus/lectures/test01/test01.tex > supertempfile
cat supertempfile > ~/Documents/calculus/lectures/test01/test01.tex
rm supertempfile
LECTURENAME=`sed -n -e '/subtitle/p' $1 | sed -e 's/.*subtitle{[a-zA-Z]* \([0-9]*\)}.*$/\1/g'`
LECTUREDATE=`sed -n -e '/.*\\date{[a-zA-Z]* [0-9]*. 2010}.*$/p' $1 | sed -e 's/.*date{\([a-zA-Z]* [0-9]*. 2010\)}.*$/\1/g'`
echo "\n% begin lecture\n\\lecture[${LECTUREDATE}]{Lecture ${LECTURENAME}}{${LECTURENAME}}" >> ~/Documents/calculus/lectures/test01/test01.tex

while read line
do
	if [ -n "$(echo $line | grep '\\subsection')" ];
	then
		echo $line | sed 's/.*\(\\subsection\)/\1/g' >> ~/Documents/calculus/lectures/test01/test01.tex
	fi
	if [ -n "$(echo $line | grep '\\section')" ];
	then
		echo $line | sed 's/.*\(\\section\)/\1/g' >> ~/Documents/calculus/lectures/test01/test01.tex
	fi
	if [ -n "$(echo $line | grep 'begin module')" ];
	then
	(
		MODULE=`echo $line | sed 's/[0-9]*:\%[ ]*begin module[ ]*\([^ ]*\)[ ]*$/\1/'`
		sed -e "s/{pictures/{`echo "${PWD##*/}"`\/pictures/g" $1 | sed -n -e "/begin module[ ]*$MODULE[ ]*$/,/end module[ ]*$MODULE[ ]*$/p" > ./${MODULE}.tex
		echo "\\input{../../modules/${PWD##*/}/${MODULE}}" >> ~/Documents/calculus/lectures/test01/test01.tex
		sed -n -e "/begin module[ ]*$MODULE/,/end module[ ]*$MODULE/p" linelist > templines
		while read subline
		do
		if [ -n "$(echo $subline | grep 'includegraphics')" ];
		then
		(
			IMAGEFILE=`echo $subline | sed 's/.*{pictures\/\([^/]*.pdf\)}.*$/\1/'`
			cp ${IMAGEFILE} ./pictures
		)
		fi
		done < templines
		rm templines
	)
	fi

done < linelist
rm linelist
echo "% end lecture\n\\end{document}" >> ~/Documents/calculus/lectures/test01/test01.tex

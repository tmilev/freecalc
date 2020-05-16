# Freecalc

Freecalc is a LaTeX/postscript project aimed at creating high quality educational materials used for teaching 
Precalculus, Calculus and Multivariable Calculus at the university level. 

There are 3 types of materials: 
- slides, intended for teaching in class with projector, 
- homework problem collections, 
- textbook [work in progress]. 

## Pre-built pdfs


### Pre-built lecture pdfs.
You can directly download pre-built pdfs from the following folder.

https://github.com/tmilev/freecalc/tree/master/lectures/referencelectures

Zip files of the 4 prebuilt courses (Precalculus, Calculus I, Calculus II, Calculus III) can be found in the following link.

[Pre-compiled courses](https://github.com/tmilev/freecalc/blob/master/lectures/referencelectures/prebuilt)


### Pre-built homework pdfs.
You can directly download pre-built pdfs from the following folder. 
The homework pdfs are organized by lecture.

https://github.com/tmilev/freecalc/tree/master/homework/referenceallproblemsbycourse

Prebuilt homeworks (Precalculus, Calculus I, Calculus II, Calculus III) can be found in the following link.

https://github.com/tmilev/freecalc/tree/master/homework/referenceallproblemsbycourse/prebuilt

### Pre-built master problem sheets.

### Report errors in the pdfs.

If you see errors in the pdfs, post the issues in the github bug tracker.

https://github.com/tmilev/freecalc/issues


## Getting the project on your machine

## Projector slides
These are intended for teaching in class with projector, with or without the aid of additional blackboard work. 

- Educational aspects:
  - Both example problems and theoretical considerations are presented in a step by step fashion. 
  - Each slide is uncovered gradually, showing one step at a time. Some slides have upwards of 60 separate steps. 
  - Various aspects of the computations are highlighted on and off depending on their use in the last computation step. 
  - Problems of considerable technical difficulty are presented in full detail.
  - While doing computations, some computation entries are initially marked with a question mark, 
prompting the students to guess what is coming next. 
  - The slides have high quality step-by-step drawn graphics with LaTeX formula labels, achieving the 
effect of highest-quality blackboard graphics. 
  - The 3d graphics are drawn using orthographic projections, with dashed background contours and 
viewing depth color shading. The quality is higher than most commercially available textbooks.
  - All graphics are accurately drawn in accordance with the problem.
- Technical aspects:
  - All slides are compiled as pdfs. 
  - Each slide is compiled in two modes: projector mode (for showing to students) and printable mode. 
The printable mode is intended for quick reference/printing on paper and lacks step-by-step uncovering of computations.
  - Each slide phase is a separate pdf page. The slides display correctly out-of-the-box
on every computer/projector combination we have tried so far, as well as on every student laptop we have seen.
  - The 2d and 3d graphics are programmed directly in the LaTeX files, and can be edited directly in your favorite
LaTeX editor. 
  - We wrote a custom 2d/3d graphics package which is included in the freecalc project. 
Feel free to change the default function graph color or the default perpendicular heel size, or anything else you like.
  - The postscript graphics are coordinated with the LaTeX content using the standard beamer class and \uncover<> commands.
  - The slides are done in LaTeX, the same format used for professional mathematical publications/scientific articles.

## Homework problems
- Educational aspects:
  - We have more than a thousand problems, should be enough for a regular-sized Calculus I/II course. 
  - Our homework sets are split into separate pdfs matching the lecture slides.
  - We also include an all-problems-in-the-course pdf file, complete with table of contents.
  - All our problem pdfs come in two versions: with and without an answer key. 
  - When the answer key is included, selected problems come with detailed solutions.
- Technical aspects:
  - Our pdf homeworks share the same commands, styling and graphics as our slides, 
providing a consistent experience to your students.

## Textbook
Our textbook is work in progress, despite the fact that composing the textbook is a lot less work than composing the projector slides.
The reason we have not completed our textbook yet is that 
we have found that students do not need or use the textbook when given all slides and homework files.
